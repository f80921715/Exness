CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator access is required.';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot delete your own administrator account.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = target_user_id
          AND role <> 'admin'
    ) THEN
        RAISE EXCEPTION 'The selected user was not found or is an administrator.';
    END IF;

    DELETE FROM auth.users
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected user was not found.';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
