import { supabase } from '../database/supabase';
import { requireSupabase } from '../database/supabase';
import { learningPathsData, CourseModule } from '../../data/learningPathsData';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  moduleCount: number;
  modules: CourseModule[];
  enrolled: boolean;
  progress: number;
  enrolled_count: number;
  rating: number;
  color: string;
  objectives: string[];
}

function stringToUuid(input: string): string {
  const hash = (s: string): string => {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x1000000b);
      if (h < 0) h >>>= 0;
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  };
  const h = hash(input);
  return `${h.slice(0,8)}-${h.slice(8,12)}-4000-a000-${'000000000000'.slice(0,12)}`;
}

function loadEnrollments(): Map<string, number> {
  const m = new Map<string, number>();
  try {
    const stored = localStorage.getItem('learning_path_enrollments');
    if (stored) {
      (JSON.parse(stored) as [string, number][]).forEach(([k, v]) => m.set(k, v));
    }
  } catch { /* intentionally ignored */ }
  return m;
}

function saveEnrollments(m: Map<string, number>) {
  localStorage.setItem('learning_path_enrollments', JSON.stringify(Array.from(m.entries())));
}

function mapLocalPath(path: typeof learningPathsData[0], enrollments: Map<string, number>): LearningPath {
  const progress = enrollments.get(path.id) ?? 0;
  return {
    id: path.id,
    title: path.title,
    description: path.description,
    icon: path.icon,
    level: path.level,
    duration: path.duration,
    moduleCount: path.modules.length,
    modules: path.modules,
    enrolled: enrollments.has(path.id),
    progress,
    enrolled_count: path.enrolled_count,
    rating: path.rating,
    color: path.color,
    objectives: path.objectives,
  };
}

class LearningPathsService {
  async getLearningPaths(userId?: string): Promise<LearningPath[]> {
    const enrollments = loadEnrollments();

    if (userId) {
      try {
        const { data } = await requireSupabase()
          .from('learning_path_enrollments')
          .select('learning_path_id, progress')
          .eq('user_id', userId);
        if (data) {
          data.forEach(e => {
            enrollments.set(e.learning_path_id, e.progress);
            const local = learningPathsData.find(p => stringToUuid(p.id) === e.learning_path_id);
            if (local) enrollments.set(local.id, e.progress);
          });
        }
      } catch { /* intentionally ignored */ }
    }

    localStorage.setItem('learning_path_enrollments', JSON.stringify(Array.from(enrollments.entries())));

    return learningPathsData.map(p => mapLocalPath(p, enrollments));
  }

  async enrollInPath(userId: string, pathId: string): Promise<boolean> {
    const enrollments = loadEnrollments();
    enrollments.set(pathId, 0);
    saveEnrollments(enrollments);

    if (userId && supabase) {
      try {
        await requireSupabase().from('learning_path_enrollments').insert({
          user_id: userId,
          learning_path_id: stringToUuid(pathId),
          progress: 0,
          enrolled_at: new Date().toISOString(),
        });
      } catch { /* intentionally ignored */ }
    }

    return true;
  }

  async updateProgress(userId: string, pathId: string, progress: number): Promise<boolean> {
    const enrollments = loadEnrollments();
    enrollments.set(pathId, progress);
    saveEnrollments(enrollments);

    if (userId && supabase) {
      try {
        await requireSupabase().from('learning_path_enrollments').update({ progress }).eq('user_id', userId).eq('learning_path_id', stringToUuid(pathId));
      } catch { /* intentionally ignored */ }
    }

    return true;
  }
}

export const learningPathsService = new LearningPathsService();



