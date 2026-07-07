INSERT INTO plan (name, requests_per_minute, price)
VALUES
    ('FREE', 10, 0.00),
    ('PRO', 100, 29.00),
    ('ENTERPRISE', 1000, 199.00)
    ON CONFLICT (name) DO NOTHING;

ALTER TABLE admin_user DROP CONSTRAINT IF EXISTS admin_user_role_check;
ALTER TABLE admin_user ADD CONSTRAINT admin_user_role_check
    CHECK (role IN ('OWNER', 'SUPER_ADMIN', 'READ_ONLY_ADMIN'));

INSERT INTO route_limit (plan_id, route_pattern, requests_per_minute)
SELECT id, '/api/products', 5 FROM plan WHERE name = 'FREE'
    ON CONFLICT DO NOTHING;

INSERT INTO route_limit (plan_id, route_pattern, requests_per_minute)
SELECT id, '/api/reports', 2 FROM plan WHERE name = 'FREE'
    ON CONFLICT DO NOTHING;

INSERT INTO route_group (name, description, active, priority, created_at, updated_at)
VALUES
    ('Products', 'Demo product endpoints', true, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reports', 'Demo report endpoints', true, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Orders', 'Demo order endpoints', true, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO route_group_rule (route_group_id, method, pattern, match_type, created_at, updated_at)
SELECT rg.id, null, '/api/products', 'EXACT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM route_group rg
WHERE rg.name = 'Products'
  AND NOT EXISTS (
      SELECT 1 FROM route_group_rule rgr
      WHERE rgr.route_group_id = rg.id
        AND rgr.method IS NULL
        AND rgr.pattern = '/api/products'
        AND rgr.match_type = 'EXACT'
  );

INSERT INTO route_group_rule (route_group_id, method, pattern, match_type, created_at, updated_at)
SELECT rg.id, null, '/api/reports', 'EXACT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM route_group rg
WHERE rg.name = 'Reports'
  AND NOT EXISTS (
      SELECT 1 FROM route_group_rule rgr
      WHERE rgr.route_group_id = rg.id
        AND rgr.method IS NULL
        AND rgr.pattern = '/api/reports'
        AND rgr.match_type = 'EXACT'
  );

INSERT INTO route_group_rule (route_group_id, method, pattern, match_type, created_at, updated_at)
SELECT rg.id, null, '/api/orders', 'EXACT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM route_group rg
WHERE rg.name = 'Orders'
  AND NOT EXISTS (
      SELECT 1 FROM route_group_rule rgr
      WHERE rgr.route_group_id = rg.id
        AND rgr.method IS NULL
        AND rgr.pattern = '/api/orders'
        AND rgr.match_type = 'EXACT'
  );

INSERT INTO admin_user (username, password, role)
VALUES (
           'owner',
           '$2a$10$00tC1UnCk6O0wFMrKYdyP.Lj7Z.EMTmUDnmeseJzp0BWn3BxWDMtq', -- Coastal gateway passphrase 2026!
           'OWNER'
       )
    ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password,
        role = EXCLUDED.role;

INSERT INTO admin_user (username, password, role)
VALUES (
           'super admin',
           '$2a$10$00tC1UnCk6O0wFMrKYdyP.Lj7Z.EMTmUDnmeseJzp0BWn3BxWDMtq', -- Coastal gateway passphrase 2026!
           'SUPER_ADMIN'
       )
    ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password,
        role = EXCLUDED.role;


INSERT INTO admin_user (username, password, role)
VALUES (
           'viewer',
           '$2a$10$00tC1UnCk6O0wFMrKYdyP.Lj7Z.EMTmUDnmeseJzp0BWn3BxWDMtq', -- Coastal gateway passphrase 2026!
           'READ_ONLY_ADMIN'
       )
    ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password,
        role = EXCLUDED.role;

-- Local development only. Raw token: demo-provisioning-token
INSERT INTO provisioning_token (name, token_hash, default_plan_name, active, created_at)
VALUES (
           'Local Demo Provisioner',
           '$2a$10$0moifO.zZhsGrz/gspi4EeKQjeZkEBbp2Ea7qnFhFfvadWNfPHd1C',
           'FREE',
           true,
           CURRENT_TIMESTAMP
       )
    ON CONFLICT (name) DO UPDATE
    SET token_hash = EXCLUDED.token_hash,
        default_plan_name = EXCLUDED.default_plan_name,
        active = EXCLUDED.active;

INSERT INTO gateway_settings (id, upstream_base_url, health_check_path, timeout_ms, updated_at, updated_by)
VALUES (
           1,
           'http://backend-service:8081',
           '/health',
           5000,
           CURRENT_TIMESTAMP,
           'system'
       )
    ON CONFLICT (id) DO NOTHING;

INSERT INTO client (name, api_key, plan_id, active)
SELECT
    'Demo Free Client',
    'free-demo-api-key',
    id,
    true
FROM plan
WHERE name = 'FREE'
    ON CONFLICT (api_key) DO NOTHING;


INSERT INTO client (name, api_key, plan_id, active)
SELECT
    'Demo Pro Client',
    'pro-demo-api-key',
    id,
    true
FROM plan
WHERE name = 'PRO'
    ON CONFLICT (api_key) DO NOTHING;
