
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id uuid NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date
);

CREATE OR REPLACE FUNCTION public.validate_analytics_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.event_type NOT IN ('visit', 'play_start') THEN
    RAISE EXCEPTION 'invalid event_type';
  END IF;
  NEW.created_at := now();
  NEW.day := (now() AT TIME ZONE 'utc')::date;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_analytics_event_trg
  BEFORE INSERT OR UPDATE ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_analytics_event();

CREATE INDEX analytics_events_day_idx ON public.analytics_events (day, event_type);
CREATE INDEX analytics_events_visitor_idx ON public.analytics_events (visitor_id);

GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record an event" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read events" ON public.analytics_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.players_today()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(DISTINCT visitor_id)::int
  FROM public.analytics_events
  WHERE event_type = 'play_start' AND day = (now() AT TIME ZONE 'utc')::date;
$$;
GRANT EXECUTE ON FUNCTION public.players_today() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.analytics_summary()
RETURNS TABLE (
  scope text,
  unique_visitors integer,
  total_visits integer,
  players integer
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT s.scope,
         COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.id IS NOT NULL)::int,
         COUNT(*) FILTER (WHERE e.event_type = 'visit')::int,
         COUNT(DISTINCT e.visitor_id) FILTER (WHERE e.event_type = 'play_start')::int
  FROM (VALUES
    ('today', (now() AT TIME ZONE 'utc')::date),
    ('last7', ((now() AT TIME ZONE 'utc')::date - 6)),
    ('all', DATE '1970-01-01')
  ) AS s(scope, from_day)
  LEFT JOIN public.analytics_events e ON e.day >= s.from_day
  GROUP BY s.scope;
END;
$$;
GRANT EXECUTE ON FUNCTION public.analytics_summary() TO authenticated;
