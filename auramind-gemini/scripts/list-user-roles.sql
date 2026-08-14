SELECT
  au.id::text                                         AS auth_user_id,
  au.email,
  au.created_at,
  -- Branch 1: user_profiles.role
  (SELECT to_jsonb(up)->>'role'
     FROM public.user_profiles up
    WHERE up.user_id = au.id LIMIT 1)                 AS user_profiles_role,
  -- Branch 2: user_profiles.is_admin / plan
  (SELECT (to_jsonb(up)->>'is_admin')::text
     FROM public.user_profiles up
    WHERE up.user_id = au.id LIMIT 1)                 AS user_profiles_is_admin,
  (SELECT to_jsonb(up)->>'plan'
     FROM public.user_profiles up
    WHERE up.user_id = au.id LIMIT 1)                 AS user_profiles_plan,
  -- Branch 3: profiles.subscription_tier
  (SELECT to_jsonb(p)->>'subscription_tier'
     FROM public.profiles p
    WHERE p.id = au.id LIMIT 1)                       AS profiles_subscription_tier,
  -- Branch 4 (NEW from migration 20260723_admin_auth_metadata_fallback):
  au.raw_user_meta_data->>'role'                      AS auth_metadata_role,
  -- Effective admin state per current_user_is_admin() — what the RPC
  -- will actually return for this user today.
  (
    EXISTS (SELECT 1 FROM public.user_profiles up
             WHERE up.user_id = au.id
               AND to_jsonb(up)->>'role' IN ('owner','ceo','admin'))
    OR EXISTS (SELECT 1 FROM public.user_profiles up
                WHERE up.user_id = au.id
                  AND ((to_jsonb(up)->>'is_admin')::boolean = TRUE
                       OR to_jsonb(up)->>'plan' = 'pro_plus'))
    OR EXISTS (SELECT 1 FROM public.profiles p
                WHERE p.id = au.id
                  AND to_jsonb(p)->>'subscription_tier' IN ('pro_plus','admin'))
    OR EXISTS (SELECT 1 FROM auth.users au2
                WHERE au2.id = au.id
                  AND au2.raw_user_meta_data->>'role' IN ('owner','ceo','admin'))
  )::text                                              AS effective_is_admin
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 10;
