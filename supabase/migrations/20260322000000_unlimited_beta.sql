-- ── Beta: unlimited flag op profiles ─────────────────────────────────────────
-- Wanneer unlimited = TRUE verbruikt een analyse GEEN token.
-- Jij zet dit via Admin per user aan voor beta testers.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unlimited BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Update use_token(): skip decrement als unlimited = TRUE ───────────────────
CREATE OR REPLACE FUNCTION public.use_token()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tokens  INTEGER;
  is_unlimited    BOOLEAN;
BEGIN
  SELECT tokens, unlimited
    INTO current_tokens, is_unlimited
    FROM public.profiles
   WHERE user_id = auth.uid()
   FOR UPDATE;

  -- Unlimited beta users: altijd true, geen decrement
  IF is_unlimited = TRUE THEN
    RETURN TRUE;
  END IF;

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

-- ── Admin RPC: unlimited toggling ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_unlimited(p_user_id UUID, p_unlimited BOOLEAN)
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
     SET unlimited = p_unlimited
   WHERE user_id = p_user_id;
END;
$$;

-- ── Update admin_get_users() om unlimited te tonen ────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  user_id       UUID,
  email         TEXT,
  full_name     TEXT,
  club_name     TEXT,
  tokens        INTEGER,
  unlimited     BOOLEAN,
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
    p.unlimited,
    COUNT(DISTINCT a.id)  AS athlete_count,
    COUNT(DISTINCT tr.id) AS test_count,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.athletes a  ON a.user_id  = p.user_id
  LEFT JOIN public.test_results tr ON tr.athlete_id = a.id
  GROUP BY p.user_id, u.email, p.full_name, p.club_name, p.tokens, p.unlimited, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;
