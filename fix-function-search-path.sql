-- Fix Function Search Path Mutable Warnings
-- Set search_path for all functions to prevent security vulnerabilities

-- ============================================================
-- 1. Fix handle_new_user function
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Fix handle_updated_at function
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Fix cleanup_expired_verifications function
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_verifications
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ============================================================
-- 4. Fix update_owner_consent_logs_updated_at function
-- ============================================================

CREATE OR REPLACE FUNCTION update_owner_consent_logs_updated_at()
RETURNS TRIGGER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Check all functions and their search_path settings
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NOT NULL THEN 
      array_to_string(p.proconfig, ', ')
    ELSE 
      'No search_path set'
  END as search_path_config,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'handle_updated_at',
    'cleanup_expired_verifications',
    'update_owner_consent_logs_updated_at'
  )
ORDER BY p.proname;
