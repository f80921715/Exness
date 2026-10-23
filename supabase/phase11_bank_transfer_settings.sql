-- Bank transfer details shown on the client deposit page.
CREATE TABLE IF NOT EXISTS public.bank_transfer_settings (
    id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
    bank_name TEXT NOT NULL DEFAULT 'Demo',
    account_name TEXT NOT NULL DEFAULT 'Demo Account',
    account_number TEXT NOT NULL DEFAULT '1234567890',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bank_transfer_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1
           FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime'
             AND schemaname = 'public'
             AND tablename = 'bank_transfer_settings'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_transfer_settings;
    END IF;
END
$$;

DROP POLICY IF EXISTS "Authenticated users can read bank transfer settings" ON public.bank_transfer_settings;
CREATE POLICY "Authenticated users can read bank transfer settings"
    ON public.bank_transfer_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins can insert bank transfer settings" ON public.bank_transfer_settings;
CREATE POLICY "Admins can insert bank transfer settings"
    ON public.bank_transfer_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update bank transfer settings" ON public.bank_transfer_settings;
CREATE POLICY "Admins can update bank transfer settings"
    ON public.bank_transfer_settings FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.bank_transfer_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bank_transfer_settings TO authenticated;

INSERT INTO public.bank_transfer_settings (id, bank_name, account_name, account_number)
VALUES ('default', 'Demo', 'Demo Account', '1234567890')
ON CONFLICT (id) DO NOTHING;
