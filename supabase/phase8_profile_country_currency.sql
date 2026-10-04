BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS country TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT;

UPDATE public.profiles AS profile
SET country = COALESCE(NULLIF(BTRIM(auth_user.raw_user_meta_data->>'country'), ''), profile.country),
    currency = CASE
        WHEN LOWER(COALESCE(NULLIF(auth_user.raw_user_meta_data->>'language', ''), 'en')) = 'en'
            AND LOWER(COALESCE(NULLIF(auth_user.raw_user_meta_data->>'country', ''), profile.country, '')) = 'south africa'
            THEN 'ZAR'
        ELSE COALESCE(
            NULLIF(UPPER(BTRIM(auth_user.raw_user_meta_data->>'currency')), ''),
            NULLIF(UPPER(BTRIM(profile.currency)), ''),
            'USD'
        )
    END
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id;

UPDATE public.profiles
SET currency = 'USD'
WHERE currency IS NULL OR BTRIM(currency) = '';

ALTER TABLE public.profiles
    ALTER COLUMN currency SET DEFAULT 'USD',
    ALTER COLUMN currency SET NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    country_value TEXT := NULLIF(BTRIM(NEW.raw_user_meta_data->>'country'), '');
    language_value TEXT := LOWER(COALESCE(NULLIF(NEW.raw_user_meta_data->>'language', ''), 'en'));
    currency_value TEXT := UPPER(NULLIF(BTRIM(NEW.raw_user_meta_data->>'currency'), ''));
BEGIN
    IF language_value = 'en' AND LOWER(COALESCE(country_value, '')) = 'south africa' THEN
        currency_value := 'ZAR';
    ELSIF currency_value IS NULL OR currency_value !~ '^[A-Z]{3}$' THEN
        currency_value := 'USD';
    END IF;

    INSERT INTO public.profiles (
        id, email, full_name, username, phone, country, currency,
        role, balance, status, created_at, updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        country_value,
        currency_value,
        'user',
        0.00,
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        username = COALESCE(EXCLUDED.username, public.profiles.username),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        country = COALESCE(EXCLUDED.country, public.profiles.country),
        currency = EXCLUDED.currency,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

COMMIT;