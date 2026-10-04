BEGIN;

CREATE OR REPLACE FUNCTION public.admin_apply_balance_action(
    p_user_id UUID,
    p_balance_type TEXT,
    p_action TEXT,
    p_amount NUMERIC,
    p_description TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_row public.profiles;
    current_amount NUMERIC(15, 2);
    next_amount NUMERIC(15, 2);
    amount_delta NUMERIC(15, 2);
    balance_label TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator authorization required';
    END IF;

    IF p_balance_type IS NULL
        OR p_balance_type NOT IN ('investment', 'total_balance', 'total_bonus', 'profit_earned')
        OR p_action IS NULL
        OR p_action NOT IN ('addition', 'static', 'deduction')
        OR p_amount IS NULL
        OR p_amount < 0
        OR p_amount <> ROUND(p_amount, 2)
        OR (p_action <> 'static' AND p_amount = 0) THEN
        RAISE EXCEPTION 'Invalid balance action';
    END IF;

    SELECT * INTO profile_row
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    current_amount := CASE p_balance_type
        WHEN 'investment' THEN profile_row.active_invest
        WHEN 'total_balance' THEN profile_row.balance
        WHEN 'total_bonus' THEN profile_row.bonus_balance
        ELSE profile_row.total_profit
    END;

    next_amount := CASE p_action
        WHEN 'addition' THEN current_amount + p_amount
        WHEN 'static' THEN p_amount
        ELSE current_amount - p_amount
    END;

    IF next_amount < 0 THEN
        RAISE EXCEPTION 'Balance cannot be negative';
    END IF;

    amount_delta := next_amount - current_amount;
    balance_label := CASE p_balance_type
        WHEN 'investment' THEN 'Investment'
        WHEN 'total_balance' THEN 'Total Balance'
        WHEN 'total_bonus' THEN 'Total Bonus'
        ELSE 'Profit Earned'
    END;

    UPDATE public.profiles
    SET active_invest = CASE WHEN p_balance_type = 'investment' THEN next_amount ELSE active_invest END,
        balance = CASE WHEN p_balance_type = 'total_balance' THEN next_amount ELSE balance END,
        bonus_balance = CASE WHEN p_balance_type = 'total_bonus' THEN next_amount ELSE bonus_balance END,
        total_profit = CASE WHEN p_balance_type = 'profit_earned' THEN next_amount ELSE total_profit END,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO profile_row;

    IF amount_delta <> 0 AND p_balance_type = 'total_balance' THEN
        INSERT INTO public.transactions (user_id, txid, type, asset, amount, status, is_positive)
        VALUES (
            p_user_id,
            'ADM-' || gen_random_uuid()::TEXT,
            CASE WHEN amount_delta > 0 THEN 'Deposit' ELSE 'Withdrawal' END,
            balance_label,
            ABS(amount_delta),
            'confirmed',
            amount_delta > 0
        );
    END IF;

    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (
        auth.uid(),
        'updated ' || LOWER(balance_label),
        p_user_id,
        format('%s: %s by %s; %s', balance_label, p_action, p_amount,
            COALESCE(NULLIF(BTRIM(p_description), ''), 'No description provided'))
    );

    RETURN profile_row;
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
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrator authorization required';
    END IF;
    IF p_amount IS NULL OR p_amount <= 0 OR p_amount <> ROUND(p_amount, 2)
        OR p_direction NOT IN ('increase', 'decrease') THEN
        RAISE EXCEPTION 'Invalid balance adjustment';
    END IF;

    SELECT * INTO result_row FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    next_balance := CASE WHEN p_direction = 'increase'
        THEN result_row.balance + p_amount
        ELSE result_row.balance - p_amount
    END;
    IF next_balance < 0 THEN
        RAISE EXCEPTION 'Balance cannot be negative';
    END IF;

    UPDATE public.profiles
    SET balance = next_balance, updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO result_row;

    INSERT INTO public.transactions (user_id, txid, type, asset, amount, status, is_positive)
    VALUES (
        p_user_id,
        'ADJ-' || gen_random_uuid()::TEXT,
        CASE WHEN p_direction = 'increase' THEN 'Deposit' ELSE 'Withdrawal' END,
        'Balance Adjustment',
        p_amount,
        'confirmed',
        p_direction = 'increase'
    );

    INSERT INTO public.admin_actions (admin_id, action, target_user_id, details)
    VALUES (
        auth.uid(),
        CASE WHEN p_direction = 'increase' THEN 'increased balance' ELSE 'decreased balance' END,
        p_user_id,
        'Balance adjustment of ' || p_amount::TEXT
    );

    RETURN result_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_apply_balance_action(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_user_balance(UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_apply_balance_action(UUID, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_user_balance(UUID, NUMERIC, TEXT) TO authenticated;

COMMIT;