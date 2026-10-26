-- EXNESS BROKER PLATFORM - PHASE 15: ACCOUNT UPGRADE TIERS
-- Run this script in the Supabase SQL Editor.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS account_tier TEXT;

ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_account_tier_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_account_tier_check
    CHECK (account_tier IS NULL OR account_tier IN ('bronze', 'silver', 'gold', 'diamond', 'vip'));

CREATE OR REPLACE FUNCTION public.prevent_user_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() AND auth.uid() = NEW.id THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.role <> 'user'
                OR NEW.status <> 'active'
                OR NEW.balance <> 0
                OR NEW.active_invest <> 0
                OR NEW.total_profit <> 0
                OR NEW.total_withdrawn <> 0
                OR NEW.account_tier IS NOT NULL THEN
                RAISE EXCEPTION 'Protected profile fields cannot be set by a user';
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.role IS DISTINCT FROM OLD.role
                OR NEW.status IS DISTINCT FROM OLD.status
                OR NEW.balance IS DISTINCT FROM OLD.balance
                OR NEW.active_invest IS DISTINCT FROM OLD.active_invest
                OR NEW.total_profit IS DISTINCT FROM OLD.total_profit
                OR NEW.total_withdrawn IS DISTINCT FROM OLD.total_withdrawn
                OR NEW.account_tier IS DISTINCT FROM OLD.account_tier THEN
                RAISE EXCEPTION 'Protected profile fields cannot be changed by a user';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
