
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_analytics_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.analytics_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.players_today() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.players_today() TO anon, authenticated;
