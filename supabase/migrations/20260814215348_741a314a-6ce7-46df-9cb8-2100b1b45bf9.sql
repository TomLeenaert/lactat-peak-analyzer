DROP POLICY IF EXISTS "Public can read shared results by token" ON public.shared_results;
DROP POLICY IF EXISTS "Public can read shared test results" ON public.test_results;

REVOKE SELECT ON public.shared_results FROM anon;
REVOKE SELECT ON public.test_results FROM anon;

CREATE OR REPLACE FUNCTION public.get_shared_result(p_token TEXT)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'athlete_name', sr.athlete_name,
    'test_date', COALESCE(NULLIF(sr.test_date, ''), tr.test_date::text),
    'results_json', tr.results_json
  )
  FROM public.shared_results sr
  JOIN public.test_results tr ON tr.id = sr.test_result_id
  WHERE sr.token = p_token
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_shared_result(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_result(TEXT) TO anon, authenticated;