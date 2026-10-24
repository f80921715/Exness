-- Private image storage for user-submitted deposit payment proofs.
ALTER TABLE public.deposits
    ADD COLUMN IF NOT EXISTS proof_path TEXT;

ALTER TABLE public.deposits
    DROP CONSTRAINT IF EXISTS deposits_proof_path_matches_user;

ALTER TABLE public.deposits
    ADD CONSTRAINT deposits_proof_path_matches_user
    CHECK (proof_path IS NULL OR proof_path LIKE user_id::TEXT || '/%');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'deposit-proofs',
    'deposit-proofs',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET public = FALSE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[];

DROP POLICY IF EXISTS "Users can upload their own deposit proofs" ON storage.objects;
CREATE POLICY "Users can upload their own deposit proofs"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'deposit-proofs'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

DROP POLICY IF EXISTS "Users and admins can read deposit proofs" ON storage.objects;
CREATE POLICY "Users and admins can read deposit proofs"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'deposit-proofs'
        AND (
            (storage.foldername(name))[1] = auth.uid()::TEXT
            OR public.is_admin()
        )
    );

DROP POLICY IF EXISTS "Users can remove their own deposit proofs" ON storage.objects;
CREATE POLICY "Users can remove their own deposit proofs"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id = 'deposit-proofs'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
