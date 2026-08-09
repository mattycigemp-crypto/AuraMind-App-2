-- AuraMind Database Migration: Update Learning Path Icons
-- Run this in your Supabase SQL Editor to update icon names to custom SVG icons
-- Date: 2026-05-26
-- Version: 2.1.1

-- Update icon names to match custom SVG components
UPDATE learning_paths 
SET icon = 'javascript' 
WHERE title = 'JavaScript Fundamentals';

UPDATE learning_paths 
SET icon = 'react' 
WHERE title = 'React Development';

UPDATE learning_paths 
SET icon = 'database' 
WHERE title = 'Database Management';

UPDATE learning_paths 
SET icon = 'ml' 
WHERE title = 'Machine Learning Basics';

UPDATE learning_paths 
SET icon = 'datastructures' 
WHERE title = 'Data Structures';

UPDATE learning_paths 
SET icon = 'typescript' 
WHERE title = 'Advanced TypeScript';
