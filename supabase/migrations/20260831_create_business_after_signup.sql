-- Record of public.create_profile_after_signup() applied in Supabase.
-- Trigger create_profile_after_signup_trigger already exists on auth.users.

CREATE OR REPLACE FUNCTION public.create_profile_after_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_full_name text;
  v_business_name text;
  v_business_cnpj text;
  v_business_phone text;
BEGIN
  v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), '');

  IF v_full_name IS NULL THEN
    v_full_name := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, v_full_name);

  v_business_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'business_name'), '');

  IF v_business_name IS NOT NULL THEN
    v_business_cnpj := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'business_cnpj', '')), '');
    v_business_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'business_phone', '')), '');

    INSERT INTO public.businesses (owner_id, name, cnpj, phone, plan_tier)
    VALUES (NEW.id, v_business_name, v_business_cnpj, v_business_phone, 'base')
    ON CONFLICT (owner_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
