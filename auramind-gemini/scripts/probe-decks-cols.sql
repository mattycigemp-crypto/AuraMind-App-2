SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'decks'
  AND column_name IN ('title', 'name', 'display_name', 'deck_name', 'label')
ORDER BY column_name;
