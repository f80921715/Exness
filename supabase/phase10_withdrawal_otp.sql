-- ==============================================================================
-- EXNESS BROKER PLATFORM - PHASE 10: USER WITHDRAWAL OTP & REAL-TIME ADMIN SYNC
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This script:
-- 1. Stores OTPs in an admin-readable, user-inaccessible table.
-- 2. Generates one five-minute OTP session for the authenticated user.
-- 3. Verifies and consumes a session OTP exactly once.
-- ===============================================================================

BEGIN;

-- OTPs must not be stored on profiles, which users can read for their own account.
ALTER TABLE public.profiles
    DROP COLUMN IF EXISTS withdrawal_otp,
    DROP COLUMN IF EXISTS withdrawal_otp_expires_at,
    DROP COLUMN IF EXISTS withdrawal_otp_created_at;

-- 1B. DEDICATED OTP TABLE (safe persistence for admin/user OTP lookups)
CREATE TABLE IF NOT EXISTS public.user_withdrawal_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    otp TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.user_withdrawal_otps
    ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.user_withdrawal_otps
    DROP CONSTRAINT IF EXISTS user_withdrawal_otps_user_id_created_at_key;

ALTER TABLE public.user_withdrawal_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own OTP records" ON public.user_withdrawal_otps;
DROP POLICY IF EXISTS "Admins can read all OTP records" ON public.user_withdrawal_otps;
DROP POLICY IF EXISTS "Admins can read OTP records" ON public.user_withdrawal_otps;
CREATE POLICY "Admins can read OTP records"
    ON public.user_withdrawal_otps FOR SELECT
    USING (public.is_admin());
DROP POLICY IF EXISTS "Users can insert own OTP record" ON public.user_withdrawal_otps;
DROP POLICY IF EXISTS "Admins can manage OTP records" ON public.user_withdrawal_otps;

REVOKE ALL ON TABLE public.user_withdrawal_otps FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_withdrawal_otps TO authenticated;

CREATE INDEX IF NOT EXISTS user_withdrawal_otps_active_user_idx
    ON public.user_withdrawal_otps (user_id, expires_at)
    WHERE consumed_at IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'user_withdrawal_otps'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_withdrawal_otps;
    END IF;
END;
$$;

-- A new request invalidates the user's previous unconsumed OTP session.
DROP FUNCTION IF EXISTS public.generate_user_withdrawal_otp(UUID, INT);
CREATE OR REPLACE FUNCTION public.generate_user_withdrawal_otp()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requesting_user_id UUID := auth.uid();
    new_otp TEXT;
    new_session_id UUID;
    new_expires_at TIMESTAMPTZ;
    new_created_at TIMESTAMPTZ;
BEGIN
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    PERFORM pg_advisory_xact_lock(724129559112345);
    new_created_at := clock_timestamp();
    new_expires_at := new_created_at + INTERVAL '5 minutes';
    UPDATE public.user_withdrawal_otps
    SET consumed_at = clock_timestamp()
    WHERE user_id = requesting_user_id AND consumed_at IS NULL;

    LOOP
        new_otp := LPAD((100000 + ((('x' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8))::BIT(32)::BIGINT) % 900000))::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public.user_withdrawal_otps
            WHERE otp = new_otp
              AND consumed_at IS NULL
              AND expires_at > NOW()
        );
    END LOOP;

    INSERT INTO public.user_withdrawal_otps (user_id, otp, expires_at, created_at)
    VALUES (requesting_user_id, new_otp, new_expires_at, new_created_at)
    RETURNING id INTO new_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', new_session_id,
        'expires_at', new_expires_at,
        'created_at', new_created_at
    );
END;
$$;

-- Verification is scoped to the authenticated owner and consumes a match atomically.
DROP FUNCTION IF EXISTS public.verify_user_withdrawal_otp(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.verify_user_withdrawal_otp(
    p_session_id UUID,
    p_otp TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    otp_record public.user_withdrawal_otps;
    requesting_user_id UUID := auth.uid();
    clean_otp TEXT := TRIM(COALESCE(p_otp, ''));
BEGIN
    IF requesting_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO otp_record
    FROM public.user_withdrawal_otps
    WHERE id = p_session_id AND user_id = requesting_user_id
    FOR UPDATE;

    IF otp_record.id IS NULL OR otp_record.consumed_at IS NOT NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'No active OTP');
    END IF;

    IF otp_record.expires_at <= NOW() THEN
        UPDATE public.user_withdrawal_otps SET consumed_at = clock_timestamp() WHERE id = otp_record.id;
        RETURN jsonb_build_object('valid', false, 'reason', 'OTP expired');
    END IF;

    IF otp_record.attempt_count >= 5 THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Too many attempts');
    END IF;

    IF otp_record.otp <> clean_otp THEN
        UPDATE public.user_withdrawal_otps
        SET attempt_count = attempt_count + 1,
            consumed_at = CASE WHEN attempt_count + 1 >= 5 THEN clock_timestamp() ELSE consumed_at END
        WHERE id = otp_record.id;
        IF otp_record.attempt_count + 1 >= 5 THEN
            RETURN jsonb_build_object('valid', false, 'reason', 'Too many attempts');
        END IF;
        RETURN jsonb_build_object('valid', false, 'reason', 'Incorrect OTP');
    END IF;

    UPDATE public.user_withdrawal_otps SET consumed_at = clock_timestamp() WHERE id = otp_record.id;
    RETURN jsonb_build_object('valid', true);
END;
$$;

REVOKE ALL ON FUNCTION public.generate_user_withdrawal_otp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_user_withdrawal_otp(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_user_withdrawal_otp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_withdrawal_otp(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
