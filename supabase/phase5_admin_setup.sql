-- ==============================================================================
-- EXNESS BROKER PLATFORM - PHASE 5: SECURE ADMIN SYSTEM & RLS POLICIES
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It creates the profiles table, financial ledger tables, non-recursive RLS policies,
-- auto-profile provisioning, and role synchronization.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    username TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    active_invest NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (active_invest >= 0),
    total_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_profit >= 0),
    total_withdrawn NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'topup_required')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure role/status columns and constraints exist if table was already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'profiles' AND constraint_name = 'profiles_status_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;
    END IF;

    ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check
        CHECK (status IN ('active', 'suspended', 'pending', 'topup_required'))
        NOT VALID;
END $$;

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    txid TEXT NOT NULL,
    type TEXT NOT NULL,
    asset TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'confirmed',
    is_positive BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    txid TEXT NOT NULL,
    asset TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    txid TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) NOT NULL DEFAULT 1.00,
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ADMIN ACTION AUDIT LOG
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SECURITY DEFINER HELPER FUNCTION (Database profile is the only role source)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- 8. AUTO-PROVISION USER PROFILE TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, full_name, username, phone, role, balance, status, created_at, updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
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
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. BACKFILL EXISTING USERS
INSERT INTO public.profiles (id, email, full_name, username, role, balance, status, created_at, updated_at)
SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
    'user',
    0.00,
    'active',
    u.created_at,
    NOW()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies (Non-recursive)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile without elevating role" ON public.profiles;
CREATE POLICY "Users can update own profile without elevating role"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = 'user'
        AND status IN ('active', 'suspended', 'pending', 'topup_required')
    );

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (
        public.is_admin()
        AND role IN ('user', 'admin')
        AND status IN ('active', 'suspended', 'pending', 'topup_required')
    );

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read all transactions" ON public.transactions;
CREATE POLICY "Admin can read all transactions"
    ON public.transactions FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users or admin can insert transactions" ON public.transactions;
CREATE POLICY "Users or admin can insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admin can update transactions" ON public.transactions;
CREATE POLICY "Only admin can update transactions"
    ON public.transactions FOR UPDATE
    USING (public.is_admin());

-- Deposits Policies
DROP POLICY IF EXISTS "Users can read own deposits" ON public.deposits;
CREATE POLICY "Users can read own deposits"
    ON public.deposits FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read all deposits" ON public.deposits;
CREATE POLICY "Admin can read all deposits"
    ON public.deposits FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can record deposit or admin can insert" ON public.deposits;
CREATE POLICY "Users can record deposit or admin can insert"
    ON public.deposits FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admin can update deposits" ON public.deposits;
CREATE POLICY "Only admin can update deposits"
    ON public.deposits FOR UPDATE
    USING (public.is_admin());

-- Withdrawals Policies
DROP POLICY IF EXISTS "Users can read own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can read own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read all withdrawals" ON public.withdrawals;
CREATE POLICY "Admin can read all withdrawals"
    ON public.withdrawals FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can request withdrawal or admin can insert" ON public.withdrawals;
CREATE POLICY "Users can request withdrawal or admin can insert"
    ON public.withdrawals FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Only admin can update withdrawals" ON public.withdrawals;
CREATE POLICY "Only admin can update withdrawals"
    ON public.withdrawals FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can read admin actions" ON public.admin_actions;
CREATE POLICY "Admins can read admin actions"
    ON public.admin_actions FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;
CREATE POLICY "Admins can insert admin actions"
    ON public.admin_actions FOR INSERT
    WITH CHECK (public.is_admin() AND admin_id = auth.uid());

DROP POLICY IF EXISTS "Admins can delete admin actions" ON public.admin_actions;
CREATE POLICY "Admins can delete admin actions"
    ON public.admin_actions FOR DELETE
    USING (public.is_admin());

-- 12. SECURITY HARDENING
-- Privilege must come only from the database profile, never editable auth metadata.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

DROP TRIGGER IF EXISTS on_profile_role_changed ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_role();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, full_name, username, phone, role, balance, status, created_at, updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
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
        updated_at = NOW();

    RETURN NEW;
END;
$$;

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
                OR NEW.total_withdrawn <> 0 THEN
                RAISE EXCEPTION 'Protected profile fields cannot be set by a user';
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.role IS DISTINCT FROM OLD.role
                OR NEW.status IS DISTINCT FROM OLD.status
                OR NEW.balance IS DISTINCT FROM OLD.balance
                OR NEW.active_invest IS DISTINCT FROM OLD.active_invest
                OR NEW.total_profit IS DISTINCT FROM OLD.total_profit
                OR NEW.total_withdrawn IS DISTINCT FROM OLD.total_withdrawn THEN
                RAISE EXCEPTION 'Protected profile fields cannot be changed by a user';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_profile_escalation ON public.profiles;
CREATE TRIGGER prevent_user_profile_escalation
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_profile_escalation();

CREATE OR REPLACE FUNCTION public.prevent_user_financial_status_forgery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() AND auth.uid() = NEW.user_id THEN
        IF TG_TABLE_NAME IN ('deposits', 'withdrawals') AND NEW.status <> 'pending' THEN
            RAISE EXCEPTION 'Users can only create pending requests';
        END IF;
        IF TG_TABLE_NAME = 'transactions' AND NEW.type IN ('Deposit', 'Withdrawal') AND NEW.status <> 'pending' THEN
            RAISE EXCEPTION 'Users cannot create completed financial transactions';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_deposit_status_forgery ON public.deposits;
CREATE TRIGGER prevent_user_deposit_status_forgery
    BEFORE INSERT ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_financial_status_forgery();

DROP TRIGGER IF EXISTS prevent_user_withdrawal_status_forgery ON public.withdrawals;
CREATE TRIGGER prevent_user_withdrawal_status_forgery
    BEFORE INSERT ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_financial_status_forgery();

DROP TRIGGER IF EXISTS prevent_user_transaction_status_forgery ON public.transactions;
CREATE TRIGGER prevent_user_transaction_status_forgery
    BEFORE INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.prevent_user_financial_status_forgery();

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (
        auth.uid() = id
        AND role = 'user'
        AND status = 'active'
        AND balance = 0
        AND active_invest = 0
        AND total_profit = 0
        AND total_withdrawn = 0
    );

DROP POLICY IF EXISTS "Users can update own profile without elevating role" ON public.profiles;
CREATE POLICY "Users can update own profile without elevating role"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Financial state transitions are atomic and can only be performed once.
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
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    SELECT * INTO deposit_row FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Deposit request not found'; END IF;
    IF deposit_row.status <> 'pending' THEN RAISE EXCEPTION 'Deposit request has already been processed'; END IF;

    UPDATE public.deposits SET status = 'confirmed' WHERE id = p_deposit_id RETURNING * INTO result_row;
    UPDATE public.profiles SET balance = balance + deposit_row.amount, updated_at = NOW() WHERE id = deposit_row.user_id;
    UPDATE public.transactions SET status = 'confirmed' WHERE user_id = deposit_row.user_id AND txid = deposit_row.txid AND status = 'pending';
    IF NOT FOUND THEN
        INSERT INTO public.transactions (user_id, txid, type, asset, amount, status, is_positive)
        VALUES (deposit_row.user_id, deposit_row.txid, 'Deposit', deposit_row.asset || ' (' || deposit_row.network || ')', deposit_row.amount, 'confirmed', TRUE);
    END IF;
    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), 'approved deposit', deposit_row.user_id, 'Approved deposit ' || deposit_row.id::TEXT);
    RETURN result_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_deposit(p_deposit_id UUID)
RETURNS public.deposits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deposit_row public.deposits;
    result_row public.deposits;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    SELECT * INTO deposit_row FROM public.deposits WHERE id = p_deposit_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Deposit request not found'; END IF;
    IF deposit_row.status <> 'pending' THEN RAISE EXCEPTION 'Deposit request has already been processed'; END IF;
    UPDATE public.deposits SET status = 'rejected' WHERE id = p_deposit_id RETURNING * INTO result_row;
    UPDATE public.transactions SET status = 'rejected' WHERE user_id = deposit_row.user_id AND txid = deposit_row.txid AND status = 'pending';
    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), 'rejected deposit', deposit_row.user_id, 'Rejected deposit ' || deposit_row.id::TEXT);
    RETURN result_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_withdrawal_id UUID)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    withdrawal_row public.withdrawals;
    current_balance NUMERIC(15, 2);
    result_row public.withdrawals;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    SELECT * INTO withdrawal_row FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal request not found'; END IF;
    IF withdrawal_row.status <> 'pending' THEN RAISE EXCEPTION 'Withdrawal request has already been processed'; END IF;
    SELECT balance INTO current_balance FROM public.profiles WHERE id = withdrawal_row.user_id FOR UPDATE;
    IF current_balance IS NULL OR current_balance < withdrawal_row.amount THEN RAISE EXCEPTION 'Insufficient user balance'; END IF;

    UPDATE public.withdrawals SET status = 'processed' WHERE id = p_withdrawal_id RETURNING * INTO result_row;
    UPDATE public.profiles SET balance = balance - withdrawal_row.amount, total_withdrawn = total_withdrawn + withdrawal_row.amount, updated_at = NOW() WHERE id = withdrawal_row.user_id;
    UPDATE public.transactions SET status = 'processed' WHERE user_id = withdrawal_row.user_id AND txid = withdrawal_row.txid AND status = 'pending';
    IF NOT FOUND THEN
        INSERT INTO public.transactions (user_id, txid, type, asset, amount, fee, status, is_positive)
        VALUES (withdrawal_row.user_id, withdrawal_row.txid, 'Withdrawal', withdrawal_row.network, withdrawal_row.amount, withdrawal_row.fee, 'processed', FALSE);
    END IF;
    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), 'approved withdrawal', withdrawal_row.user_id, 'Approved withdrawal ' || withdrawal_row.id::TEXT);
    RETURN result_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_withdrawal_id UUID)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    withdrawal_row public.withdrawals;
    result_row public.withdrawals;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    SELECT * INTO withdrawal_row FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal request not found'; END IF;
    IF withdrawal_row.status <> 'pending' THEN RAISE EXCEPTION 'Withdrawal request has already been processed'; END IF;
    UPDATE public.withdrawals SET status = 'rejected' WHERE id = p_withdrawal_id RETURNING * INTO result_row;
    UPDATE public.transactions SET status = 'rejected' WHERE user_id = withdrawal_row.user_id AND txid = withdrawal_row.txid AND status = 'pending';
    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), 'rejected withdrawal', withdrawal_row.user_id, 'Rejected withdrawal ' || withdrawal_row.id::TEXT);
    RETURN result_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_user_balance(p_user_id UUID, p_amount NUMERIC, p_direction TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_balance NUMERIC(15, 2);
    result_row public.profiles;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    IF p_amount IS NULL OR p_amount <= 0 OR p_direction NOT IN ('increase', 'decrease') THEN RAISE EXCEPTION 'Invalid balance adjustment'; END IF;
    SELECT * INTO result_row FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
    next_balance := CASE WHEN p_direction = 'increase' THEN result_row.balance + p_amount ELSE result_row.balance - p_amount END;
    IF next_balance < 0 THEN RAISE EXCEPTION 'Balance cannot be negative'; END IF;
    UPDATE public.profiles SET balance = next_balance, updated_at = NOW() WHERE id = p_user_id RETURNING * INTO result_row;
    INSERT INTO public.transactions (user_id, txid, type, asset, amount, status, is_positive)
    VALUES (p_user_id, 'ADJ-' || gen_random_uuid()::TEXT, CASE WHEN p_direction = 'increase' THEN 'Admin Credit' ELSE 'Admin Debit' END, 'Balance Adjustment', p_amount, 'confirmed', p_direction = 'increase');
    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), CASE WHEN p_direction = 'increase' THEN 'increased balance' ELSE 'decreased balance' END, p_user_id, 'Balance adjustment of ' || p_amount::TEXT);
    RETURN result_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_admin_action(p_action TEXT, p_target_user_id UUID, p_details TEXT)
RETURNS public.admin_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_row public.admin_actions;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator authorization required'; END IF;
    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (auth.uid(), p_action, p_target_user_id, p_details)
    RETURNING * INTO result_row;
    RETURN result_row;
END;
$$;

-- Intentionally omitted: raw bulk-delete admin action, because admin panels may reject DELETE without WHERE.
-- Keep the safer approval/rejection and balance-adjustment operations instead.

-- These tables must not expose direct status or balance mutations to clients.
DROP POLICY IF EXISTS "Only admin can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only admin can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Only admin can update withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can delete admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON public.admin_actions;

REVOKE EXECUTE ON FUNCTION public.approve_deposit(UUID), public.reject_deposit(UUID), public.approve_withdrawal(UUID), public.reject_withdrawal(UUID), public.adjust_user_balance(UUID, NUMERIC, TEXT), public.record_admin_action(TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_deposit(UUID), public.reject_deposit(UUID), public.approve_withdrawal(UUID), public.reject_withdrawal(UUID), public.adjust_user_balance(UUID, NUMERIC, TEXT), public.record_admin_action(TEXT, UUID, TEXT) TO authenticated;
