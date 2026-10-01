BEGIN;

DO $$
DECLARE
    target_user auth.users%ROWTYPE;
BEGIN
    SELECT *
    INTO target_user
    FROM auth.users
    WHERE lower(email) = lower('officialexnessbrokeragetrading@gmail.com');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No Supabase Auth account exists for officialexnessbrokeragetrading@gmail.com. Register the account first.';
    END IF;

    IF target_user.email_confirmed_at IS NULL THEN
        RAISE EXCEPTION 'The email must be confirmed before admin access is granted.';
    END IF;

    INSERT INTO public.profiles (id, email, role)
    VALUES (target_user.id, target_user.email, 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        updated_at = NOW();
END;
$$;

sign up
SELECT email, role
FROM public.profiles
WHERE lower(email) = lower('officialexnessbrokeragetrading@gmail.com');
