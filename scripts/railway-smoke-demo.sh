#!/usr/bin/env bash
#
# Example usage:
# PACIFIC_API_URL=https://your-gateway.up.railway.app \
# PACIFIC_ADMIN_USERNAME=owner \
# PACIFIC_ADMIN_PASSWORD=admin123 \
# PACIFIC_CLIENT_API_KEY=your-client-key \
# ./scripts/railway-smoke-demo.sh
#
# Demo/smoke helper only. Keep real Railway domains, passwords, tokens, and API
# keys in your shell environment, not in this repository.

set -euo pipefail

PRODUCTS_CALLS="${PACIFIC_PRODUCTS_CALLS:-12}"
REPORTS_CALLS="${PACIFIC_REPORTS_CALLS:-6}"

allowed_count=0
blocked_count=0
other_count=0

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    fail "Set $name before running this script."
  fi
}

require_integer() {
  local name="$1"
  local value="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    fail "$name must be a non-negative integer."
  fi
}

mask_secret() {
  local value="$1"
  local length="${#value}"

  if (( length <= 8 )); then
    printf '%s\n' '****'
    return
  fi

  printf '%s****%s\n' "${value:0:4}" "${value: -4}"
}

curl_json_status() {
  local method="$1"
  local url="$2"
  local output_file="$3"
  shift 3

  curl -sS \
    -X "$method" \
    -H 'Accept: application/json' \
    "$@" \
    -o "$output_file" \
    -w '%{http_code}' \
    "$url"
}

extract_token() {
  local response_file="$1"
  jq -er '.token // .accessToken // .access_token // empty' "$response_file"
}

extract_first_active_api_key() {
  local response_file="$1"
  jq -er '
    def clients:
      if type == "array" then .
      elif (.content? | type) == "array" then .content
      elif (.clients? | type) == "array" then .clients
      else []
      end;

    clients
    | map(select((.active == true or .active == "true") and ((.apiKey? // "") != "")))
    | .[0].apiKey // empty
  ' "$response_file"
}

record_gateway_status() {
  local status="$1"

  case "$status" in
    200)
      allowed_count=$((allowed_count + 1))
      ;;
    429)
      blocked_count=$((blocked_count + 1))
      ;;
    *)
      other_count=$((other_count + 1))
      ;;
  esac
}

call_gateway_route() {
  local route="$1"
  local label="$2"
  local response_file="$tmp_dir/gateway-${label//[^A-Za-z0-9_-]/_}.json"
  local status

  status="$(curl_json_status GET "$PACIFIC_API_URL$route" "$response_file" -H "X-API-Key: $client_api_key")"
  record_gateway_status "$status"
  printf '%-18s %s\n' "$label" "$status"
}

call_admin_endpoint() {
  local route="$1"
  local label="$2"
  local response_file="$tmp_dir/admin-${label//[^A-Za-z0-9_-]/_}.json"
  local status
  local count

  status="$(curl_json_status GET "$PACIFIC_API_URL$route" "$response_file" -H "Authorization: Bearer $admin_token")"

  if jq -e 'type == "array"' "$response_file" >/dev/null 2>&1; then
    count="$(jq 'length' "$response_file")"
    printf '%-28s %s (%s rows)\n' "$label" "$status" "$count"
  else
    printf '%-28s %s\n' "$label" "$status"
  fi
}

if ! command -v jq >/dev/null 2>&1; then
  fail 'Install jq first.'
fi

if ! command -v curl >/dev/null 2>&1; then
  fail 'Install curl first.'
fi

require_env PACIFIC_API_URL
require_env PACIFIC_ADMIN_USERNAME
require_env PACIFIC_ADMIN_PASSWORD
require_integer PACIFIC_PRODUCTS_CALLS "$PRODUCTS_CALLS"
require_integer PACIFIC_REPORTS_CALLS "$REPORTS_CALLS"

PACIFIC_API_URL="${PACIFIC_API_URL%/}"

printf 'Pacific Railway smoke demo\n'
printf 'API URL: %s\n' "$PACIFIC_API_URL"
printf 'Products calls: %s\n' "$PRODUCTS_CALLS"
printf 'Reports calls: %s\n' "$REPORTS_CALLS"
printf '\n'

login_body="$tmp_dir/login-request.json"
login_response="$tmp_dir/login-response.json"
jq -n \
  --arg username "$PACIFIC_ADMIN_USERNAME" \
  --arg password "$PACIFIC_ADMIN_PASSWORD" \
  '{username: $username, password: $password}' > "$login_body"

printf 'Logging in as admin user: %s\n' "$PACIFIC_ADMIN_USERNAME"
login_status="$(curl_json_status POST "$PACIFIC_API_URL/auth/login" "$login_response" -H 'Content-Type: application/json' --data-binary "@$login_body")"

if [[ "$login_status" != "200" ]]; then
  printf 'Login failed with HTTP %s. Response:\n' "$login_status" >&2
  jq -c . "$login_response" >&2 || sed -n '1,5p' "$login_response" >&2
  exit 1
fi

admin_token="$(extract_token "$login_response")" || fail 'Login response did not include an admin access token.'
printf 'Login: %s\n' "$login_status"

if [[ -n "${PACIFIC_CLIENT_API_KEY:-}" ]]; then
  client_api_key="$PACIFIC_CLIENT_API_KEY"
  printf 'Client API key: %s (from PACIFIC_CLIENT_API_KEY)\n' "$(mask_secret "$client_api_key")"
else
  clients_response="$tmp_dir/clients-response.json"
  printf 'Fetching active clients from /admin/clients...\n'
  clients_status="$(curl_json_status GET "$PACIFIC_API_URL/admin/clients" "$clients_response" -H "Authorization: Bearer $admin_token")"

  if [[ "$clients_status" != "200" ]]; then
    printf 'Could not fetch clients. HTTP %s. Response:\n' "$clients_status" >&2
    jq -c . "$clients_response" >&2 || sed -n '1,5p' "$clients_response" >&2
    exit 1
  fi

  client_api_key="$(extract_first_active_api_key "$clients_response" || true)"
  if [[ -z "$client_api_key" ]]; then
    cat >&2 <<'MSG'
No active client API key was available from /admin/clients.
Create or copy a client API key from the Pacific UI, then rerun with:

PACIFIC_CLIENT_API_KEY=your-client-key ./scripts/railway-smoke-demo.sh
MSG
    exit 1
  fi

  printf 'Client API key: %s (first active client returned by API)\n' "$(mask_secret "$client_api_key")"
fi

printf '\nGenerating gateway traffic...\n'
printf '%-18s %s\n' 'route' 'status'

for ((i = 1; i <= PRODUCTS_CALLS; i++)); do
  call_gateway_route '/api/products' "products-$i"
done

for ((i = 1; i <= REPORTS_CALLS; i++)); do
  call_gateway_route '/api/reports' "reports-$i"
done

printf '\nOptional known wildcard route check...\n'
call_gateway_route '/api/orders' 'orders'

printf '\nChecking admin analytics endpoints...\n'
call_admin_endpoint '/admin/dashboard/summary' 'Dashboard summary'
call_admin_endpoint '/admin/analytics/routes' 'Top routes'
call_admin_endpoint '/admin/analytics/clients' 'Client analytics'
call_admin_endpoint '/admin/analytics/traffic' 'Traffic analytics'
call_admin_endpoint '/admin/analytics/route-traffic' 'Route traffic trend'
call_admin_endpoint '/admin/abuse-alerts' 'Abuse alerts'

printf '\nSmoke summary\n'
printf 'Allowed gateway responses: %s\n' "$allowed_count"
printf 'Blocked gateway responses: %s\n' "$blocked_count"
printf 'Other gateway responses: %s\n' "$other_count"
printf '\n'
printf 'Updated demo data should be visible in these UI pages:\n'
printf '- Dashboard\n'
printf '- Analytics\n'
printf '- Abuse Alerts\n'
printf '- Clients\n'
