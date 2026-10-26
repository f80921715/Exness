-- EXNESS BROKER PLATFORM - PHASE 16: APPROVED ACCOUNT UPGRADE PAYMENTS
-- Run after Phase 15 in the Supabase SQL Editor.

ALTER TABLE public.deposits
    ADD COLUMN IF NOT EXISTS upgrade_tier TEXT;

ALTER TABLE public.deposits
    DROP CONSTRAINT IF EXISTS deposits_upgrade_tier_check;

ALTER TABLE public.deposits
    ADD CONSTRAINT deposits_upgrade_tier_check
    CHECK (upgrade_tier IS NULL OR upgrade_tier IN ('silver', 'gold', 'diamond', 'vip'));

CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id UUID)
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deposit_row public.deposits;
    result_row public.deposits;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator authorization required';
    END IF;

    SELECT * INTO deposit_row
    FROM public.deposits
    WHERE id = p_deposit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit request not found';
    END IF;
    IF deposit_row.status <> 'pending' THEN
        RAISE EXCEPTION 'Deposit request has already been processed';
    END IF;

    UPDATE public.deposits
    SET status = 'confirmed'
    WHERE id = p_deposit_id
    RETURNING * INTO result_row;

    UPDATE public.profiles AS profile
    SET balance = profile.balance + deposit_row.amount,
        account_tier = COALESCE(deposit_row.upgrade_tier, profile.account_tier),
        updated_at = NOW()
    WHERE profile.id = deposit_row.user_id;

    UPDATE public.transactions
    SET status = 'confirmed'
    WHERE user_id = deposit_row.user_id
      AND txid = deposit_row.txid
      AND status = 'pending';

    IF NOT FOUND THEN
        INSERT INTO public.transactions (user_id, txid, type, asset, amount, status, is_positive)
        VALUES (
            deposit_row.user_id,
            deposit_row.txid,
            CASE WHEN deposit_row.upgrade_tier IS NULL THEN 'Deposit' ELSE 'Account Upgrade' END,
            deposit_row.asset || ' (' || deposit_row.network || ')',
            deposit_row.amount,
            'confirmed',
            TRUE
        );
    END IF;

    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (
        auth.uid(),
        'approved deposit',
        deposit_row.user_id,
        CASE
            WHEN deposit_row.upgrade_tier IS NULL THEN 'Approved deposit ' || deposit_row.id::TEXT
            ELSE 'Approved ' || UPPER(deposit_row.upgrade_tier) || ' account upgrade payment ' || deposit_row.id::TEXT
        END
    );

    RETURN result_row;
END;
$$;
