CREATE OR REPLACE FUNCTION public.admin_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  since_date date := DATE '2026-05-03';
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'users', (SELECT COUNT(*) FROM public.profiles),
      'athletes', (SELECT COUNT(*) FROM public.athletes),
      'tests', (SELECT COUNT(*) FROM public.test_results),
      'tests_last_7d', (SELECT COUNT(*) FROM public.test_results WHERE created_at > now() - interval '7 days'),
      'tests_last_30d', (SELECT COUNT(*) FROM public.test_results WHERE created_at >= since_date),
      'new_users_last_30d', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= since_date),
      'share_events_total', (SELECT COUNT(*) FROM public.analytics_events WHERE event_type LIKE 'share_%'),
      'visitors_total', (SELECT COUNT(*) FROM public.analytics_events WHERE event_type = 'page_view'),
      'visitors_last_7d', (SELECT COUNT(*) FROM public.analytics_events WHERE event_type = 'page_view' AND created_at > now() - interval '7 days'),
      'visitors_unique_30d', (SELECT COUNT(DISTINCT COALESCE(metadata->>'sid', id::text)) FROM public.analytics_events WHERE event_type = 'page_view' AND created_at >= since_date)
    ),
    'share_breakdown', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('event_type', event_type, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
      FROM (
        SELECT event_type, COUNT(*) AS cnt
        FROM public.analytics_events
        WHERE event_type LIKE 'share_%'
        GROUP BY event_type
      ) s
    ),
    'tests_per_day', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS cnt
        FROM public.test_results
        WHERE created_at >= since_date
        GROUP BY 1
      ) d
    ),
    'signups_per_day', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS cnt
        FROM public.profiles
        WHERE created_at >= since_date
        GROUP BY 1
      ) d
    ),
    'visitors_per_day', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day, 'count', cnt) ORDER BY day), '[]'::jsonb)
      FROM (
        SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS cnt
        FROM public.analytics_events
        WHERE event_type = 'page_view' AND created_at >= since_date
        GROUP BY 1
      ) d
    ),
    'top_users', '[]'::jsonb,
    'coaches_overview', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY tests_total DESC, athlete_count DESC, full_name ASC), '[]'::jsonb)
      FROM (
        SELECT
          p.user_id,
          COALESCE(NULLIF(p.full_name, ''), u.email) AS full_name,
          p.club_name,
          u.email,
          p.created_at AS signup_at,
          (SELECT COUNT(*) FROM public.athletes a WHERE a.user_id = p.user_id) AS athlete_count,
          (SELECT COUNT(*) FROM public.test_results tr
            JOIN public.athletes a ON a.id = tr.athlete_id
            WHERE a.user_id = p.user_id) AS tests_total,
          (SELECT COUNT(*) FROM public.test_results tr
            JOIN public.athletes a ON a.id = tr.athlete_id
            WHERE a.user_id = p.user_id
              AND EXISTS (
                SELECT 1 FROM jsonb_array_elements(COALESCE(tr.steps_json,'[]'::jsonb)) s
                WHERE COALESCE((s->>'lactate')::numeric, 0) > 0
              )) AS tests_with_data,
          (SELECT COUNT(*) FROM public.test_results tr
            JOIN public.athletes a ON a.id = tr.athlete_id
            WHERE a.user_id = p.user_id
              AND tr.results_json <> '{}'::jsonb) AS tests_calculated,
          (SELECT MAX(tr.created_at) FROM public.test_results tr
            JOIN public.athletes a ON a.id = tr.athlete_id
            WHERE a.user_id = p.user_id) AS last_test_at,
          (SELECT COUNT(*) FROM public.analytics_events ev
            WHERE ev.user_id = p.user_id AND ev.event_type = 'share_whatsapp') AS shares_whatsapp,
          (SELECT COUNT(*) FROM public.analytics_events ev
            WHERE ev.user_id = p.user_id AND ev.event_type = 'share_pdf') AS shares_pdf,
          (SELECT COUNT(*) FROM public.analytics_events ev
            WHERE ev.user_id = p.user_id AND ev.event_type = 'share_image') AS shares_image,
          (SELECT COUNT(*) FROM public.analytics_events ev
            WHERE ev.user_id = p.user_id AND ev.event_type = 'share_link') AS shares_link,
          (SELECT COUNT(*) FROM public.analytics_events ev
            WHERE ev.user_id = p.user_id AND ev.event_type LIKE 'share_%') AS export_count,
          (SELECT MAX(ev.created_at) FROM public.analytics_events ev
            WHERE ev.user_id = p.user_id AND ev.event_type LIKE 'share_%') AS last_export_at,
          GREATEST(
            COALESCE((SELECT MAX(tr.created_at) FROM public.test_results tr
              JOIN public.athletes a ON a.id = tr.athlete_id
              WHERE a.user_id = p.user_id), p.created_at),
            COALESCE((SELECT MAX(a.created_at) FROM public.athletes a WHERE a.user_id = p.user_id), p.created_at)
          ) AS last_activity_at
        FROM public.profiles p
        LEFT JOIN auth.users u ON u.id = p.user_id
      ) t
    ),
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY ts DESC), '[]'::jsonb)
      FROM (
        (
          SELECT 'test'::text AS kind, tr.created_at AS ts,
            a.name AS subject,
            (SELECT u.email FROM auth.users u WHERE u.id = a.user_id) AS actor,
            NULL::text AS detail
          FROM public.test_results tr
          JOIN public.athletes a ON a.id = tr.athlete_id
          WHERE tr.created_at >= since_date
          ORDER BY tr.created_at DESC
          LIMIT 50
        )
        UNION ALL
        (
          SELECT 'event'::text AS kind, ev.created_at AS ts,
            ev.event_type AS subject,
            (SELECT u.email FROM auth.users u WHERE u.id = ev.user_id) AS actor,
            ev.metadata::text AS detail
          FROM public.analytics_events ev
          WHERE ev.created_at >= since_date AND ev.event_type LIKE 'share_%'
          ORDER BY ev.created_at DESC
          LIMIT 50
        )
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$function$;