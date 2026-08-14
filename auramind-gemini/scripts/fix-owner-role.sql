-- Create user_profiles row for the current user (kada.hill100@gmail.com)
-- with role = 'owner'. Use upsert to avoid duplicates.
INSERT INTO public.user_profiles (id, user_id, email, role, level, xp, streak_days, cards_studied, decks_created, sessions_completed)
VALUES (
  '90ca413c-c4ce-47be-9ae9-0ae60474708c',
  '90ca413c-c4ce-47be-9ae9-0ae60474708c',
  'kada.hill100@gmail.com',
  'owner',
  1, 0, 0, 0, 0, 0
)
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
