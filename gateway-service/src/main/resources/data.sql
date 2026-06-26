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

INSERT INTO admin_user (username, password, role)
VALUES (
           'owner',
           '$2a$10$VesL5BPpxoJCpR3IyPN58uSDxrCpElhhO0x0P38VrttzV2dk1js0i', -- admin123
           'OWNER'
       )
    ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password,
        role = EXCLUDED.role;

INSERT INTO admin_user (username, password, role)
VALUES (
           'super admin',
           '$2a$10$VesL5BPpxoJCpR3IyPN58uSDxrCpElhhO0x0P38VrttzV2dk1js0i', -- admin123
           'SUPER_ADMIN'
       )
    ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password,
        role = EXCLUDED.role;


INSERT INTO admin_user (username, password, role)
VALUES (
           'viewer',
           '$2a$10$VesL5BPpxoJCpR3IyPN58uSDxrCpElhhO0x0P38VrttzV2dk1js0i', -- admin123
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
