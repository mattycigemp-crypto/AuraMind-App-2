-- AuraMind Database Migration: Learning Paths
-- Run this in your Supabase SQL Editor to add learning paths functionality
-- Date: 2026-05-26
-- Version: 2.1.0

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'book',
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration TEXT NOT NULL,
  modules INTEGER NOT NULL DEFAULT 0,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
  color TEXT NOT NULL DEFAULT 'from-blue-500 to-cyan-500',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create learning_path_enrollments table
CREATE TABLE IF NOT EXISTS learning_path_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, learning_path_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_learning_paths_level ON learning_paths(level);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_at ON learning_paths(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_user_id ON learning_path_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_enrollments_learning_path_id ON learning_path_enrollments(learning_path_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_enrollments_updated_at BEFORE UPDATE ON learning_path_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment enrolled_count
CREATE OR REPLACE FUNCTION increment_enrolled_count(path_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE learning_paths
  SET enrolled_count = enrolled_count + 1
  WHERE id = path_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_paths (read-only for authenticated users)
CREATE POLICY "Anyone can view learning paths" ON learning_paths
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for learning_path_enrollments
CREATE POLICY "Users can view their own enrollments" ON learning_path_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments" ON learning_path_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON learning_path_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments" ON learning_path_enrollments
  FOR DELETE USING (auth.uid() = user_id);

-- Insert sample learning paths
INSERT INTO learning_paths (title, description, icon, level, duration, modules, enrolled_count, rating, color) VALUES
  ('JavaScript Fundamentals', 'Master the basics of JavaScript programming language including variables, functions, arrays, objects, and more.', 'javascript', 'beginner', '4 weeks', 12, 1234, 4.8, 'from-yellow-500 to-orange-500'),
  ('React Development', 'Build modern web applications with React including hooks, state management, and component architecture.', 'react', 'intermediate', '6 weeks', 18, 892, 4.9, 'from-blue-500 to-cyan-500'),
  ('Database Management', 'Learn SQL and database design principles including normalization, indexing, and query optimization.', 'database', 'intermediate', '5 weeks', 15, 654, 4.7, 'from-purple-500 to-pink-500'),
  ('Machine Learning Basics', 'Introduction to ML concepts and algorithms including supervised learning, unsupervised learning, and neural networks.', 'ml', 'advanced', '8 weeks', 24, 432, 4.9, 'from-green-500 to-emerald-500'),
  ('Data Structures', 'Master essential data structures and algorithms including arrays, linked lists, trees, graphs, and sorting algorithms.', 'datastructures', 'intermediate', '7 weeks', 20, 789, 4.8, 'from-red-500 to-rose-500'),
  ('Advanced TypeScript', 'Deep dive into TypeScript features and patterns including generics, decorators, and advanced type system concepts.', 'typescript', 'advanced', '6 weeks', 16, 321, 4.9, 'from-indigo-500 to-violet-500');
