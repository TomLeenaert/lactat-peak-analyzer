-- ── 1. Tokens kolom op profiles ─────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tokens INTEGER NOT NULL DEFAULT 3;

-- ── 2. Audit tabel voor token transacties ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,       -- positief = bijgekomen, negatief = verbruikt
  reason     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ── 3. RPC: 1 token verbruiken (atomisch) ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.use_token()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tokens INTEGER;
BEGIN
  SELECT tokens INTO current_tokens
    FROM public.profiles
   WHERE user_id = auth.uid()
   FOR UPDATE;

  IF current_tokens IS NULL OR current_tokens <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
     SET tokens = tokens - 1
   WHERE user_id = auth.uid();

  INSERT INTO public.token_transactions (user_id, amount, reason)
  VALUES (auth.uid(), -1, 'analyse');

  RETURN TRUE;
END;
$$;

-- ── 4. Admin RPC: alle users met stats ophalen ───────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  user_id       UUID,
  email         TEXT,
  full_name     TEXT,
  club_name     TEXT,
  tokens        INTEGER,
  athlete_count BIGINT,
  test_count    BIGINT,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) != 'tomleenaert@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::TEXT,
    p.full_name,
    p.club_name,
    p.tokens,
    COUNT(DISTINCT a.id)  AS athlete_count,
    COUNT(DISTINCT tr.id) AS test_count,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.athletes a  ON a.user_id  = p.user_id
  LEFT JOIN public.test_results tr ON tr.athlete_id = a.id
  GROUP BY p.user_id, u.email, p.full_name, p.club_name, p.tokens, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

-- ── 5. Admin RPC: tokens toekennen aan een user ──────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_grant_tokens(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) != 'tomleenaert@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.profiles
     SET tokens = tokens + p_amount
   WHERE user_id = p_user_id;

  INSERT INTO public.token_transactions (user_id, amount, reason)
  VALUES (p_user_id, p_amount, 'admin grant');
END;
$$;
