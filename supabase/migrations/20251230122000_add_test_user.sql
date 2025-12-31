-- Migration: Add test user for local development
-- This adds a test user to auth.users to satisfy foreign key constraints during local development

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES 
  (
    '3c46f389-eff8-4030-a790-3108f9bf2179',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    '$2a$10$xvJZqXZ0.V5xV5xV5xV5xO',  -- dummy encrypted password
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Test User"}',
    false
  ),
  (
    '9ad9b862-5e70-4bad-afed-e8ddaea568f1',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test2@example.com',
    '$2a$10$xvJZqXZ0.V5xV5xV5xV5xO',  -- dummy encrypted password
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Test User 2"}',
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Insert identity for the test user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE provider = 'email' AND provider_id = '3c46f389-eff8-4030-a790-3108f9bf2179'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '3c46f389-eff8-4030-a790-3108f9bf2179',
      '{"sub":"3c46f389-eff8-4030-a790-3108f9bf2179","email":"test@example.com"}',
      'email',
      '3c46f389-eff8-4030-a790-3108f9bf2179',
      now(),
      now(),
      now()
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities 
    WHERE provider = 'email' AND provider_id = '9ad9b862-5e70-4bad-afed-e8ddaea568f1'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '9ad9b862-5e70-4bad-afed-e8ddaea568f1',
      '{"sub":"9ad9b862-5e70-4bad-afed-e8ddaea568f1","email":"test2@example.com"}',
      'email',
      '9ad9b862-5e70-4bad-afed-e8ddaea568f1',
      now(),
      now(),
      now()
    );
  END IF;
END $$;


