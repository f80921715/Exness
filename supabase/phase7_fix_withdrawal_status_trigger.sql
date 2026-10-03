BEGIN;

CREATE OR REPLACE FUNCTION public.prevent_user_financial_status_forgery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() AND auth.uid() = NEW.user_id THEN
        IF TG_TABLE_NAME IN ('deposits', 'withdrawals') THEN
            IF NEW.status IS DISTINCT FROM 'pending' THEN
                RAISE EXCEPTION 'Users can only create pending requests';
            END IF;
        ELSIF TG_TABLE_NAME = 'transactions' THEN
            IF NEW.type IN ('Deposit', 'Withdrawal') AND NEW.status IS DISTINCT FROM 'pending' THEN
                RAISE EXCEPTION 'Users cannot create completed financial transactions';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

COMMIT;
