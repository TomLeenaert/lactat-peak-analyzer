-- ── Shared results: publieke deelbare testlinks ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.shared_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token          TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  test_result_id UUID NOT NULL REFERENCES public.test_results(id) ON DELETE CASCADE,
  athlete_name   TEXT NOT NULL,
  test_date      TEXT NOT NULL,
  created_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Publiek leesbaar via token (geen login nodig)
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read shared results by token"
  ON public.shared_results FOR SELECT
  USING (true);

CREATE POLICY "Owner can insert own shared results"
  ON public.shared_results FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner can delete own shared results"
  ON public.shared_results FOR DELETE
  USING (auth.uid() = created_by);

-- ── Publieke leestoegang op test_results via share token ─────────────────────
-- Atleten (zonder login) kunnen een gedeeld testresultaat lezen
CREATE POLICY "Public can read shared test results"
  ON public.test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_results sr
      WHERE sr.test_result_id = test_results.id
    )
  );

-- ── RPC: maak een share link aan voor een test ───────────────────────────────
CREATE OR REPLACE FUNCTION public.create_share_link(
  p_test_result_id UUID,
  p_athlete_name   TEXT,
  p_test_date      TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_existing TEXT;
BEGIN
  -- Check of er al een share bestaat voor deze test
  SELECT token INTO v_existing
    FROM public.shared_results
   WHERE test_result_id = p_test_result_id
     AND created_by = auth.uid();

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Maak nieuw share record
  INSERT INTO public.shared_results (test_result_id, athlete_name, test_date, created_by)
  VALUES (p_test_result_id, p_athlete_name, p_test_date, auth.uid())
  RETURNING token INTO v_token;

  RETURN v_token;
END;
$$;
