SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name || '(' || ccu.column_name || ')' AS references
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
 AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'study_sessions'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.constraint_name;
