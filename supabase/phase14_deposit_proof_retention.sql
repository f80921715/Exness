-- Proof files are permanently removed from Supabase Storage one calendar month
-- after their deposit request was created.
--
-- Before running this migration, save these values in Supabase Vault:
-- SELECT vault.create_secret(
--     'https://<project-ref>.supabase.co',
--     'deposit_proof_cleanup_url'
-- );
-- SELECT vault.create_secret(
--     '<service-role-key>',
--     'deposit_proof_cleanup_service_role_key'
-- );
-- Deploy supabase/functions/cleanup-deposit-proofs before enabling the schedule.
-- Never commit the service-role key to source control.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM vault.decrypted_secrets
        WHERE name = 'deposit_proof_cleanup_url'
    ) OR NOT EXISTS (
        SELECT 1 FROM vault.decrypted_secrets
        WHERE name = 'deposit_proof_cleanup_service_role_key'
    ) THEN
        RAISE EXCEPTION 'Add the deposit proof cleanup URL and service-role key to Supabase Vault before running this migration.';
    END IF;
END;
$$;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'deposit-proof-monthly-retention';

SELECT cron.schedule(
    'deposit-proof-monthly-retention',
    '15 3 * * *',
    $job$
        SELECT net.http_post(
            url := (
                SELECT rtrim(decrypted_secret, '/')
                FROM vault.decrypted_secrets
                WHERE name = 'deposit_proof_cleanup_url'
            ) || '/functions/v1/cleanup-deposit-proofs',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (
                    SELECT decrypted_secret
                    FROM vault.decrypted_secrets
                    WHERE name = 'deposit_proof_cleanup_service_role_key'
                ),
                'apikey', (
                    SELECT decrypted_secret
                    FROM vault.decrypted_secrets
                    WHERE name = 'deposit_proof_cleanup_service_role_key'
                )
            ),
            body := '{}'::jsonb
        );
    $job$
);
