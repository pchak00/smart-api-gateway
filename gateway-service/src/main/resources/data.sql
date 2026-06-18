INSERT INTO plan (name, requests_per_minute, price)
VALUES
    ('FREE', 10, 0.00),
    ('PRO', 100, 29.00),
    ('ENTERPRISE', 1000, 199.00)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO route_limit (plan_id, route_pattern, requests_per_minute)
SELECT id, '/api/products', 5 FROM plan WHERE name = 'FREE'
    ON CONFLICT DO NOTHING;

INSERT INTO route_limit (plan_id, route_pattern, requests_per_minute)
SELECT id, '/api/reports', 2 FROM plan WHERE name = 'FREE'
    ON CONFLICT DO NOTHING;

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
