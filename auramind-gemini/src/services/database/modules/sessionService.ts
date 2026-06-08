import { supabase } from '../supabase';
import { StudySession } from '../../../types';

export const sessionService = {
    async saveStudySession(session: Omit<StudySession, 'id'>): Promise<StudySession> {
        if (!supabase) throw new Error('Supabase not initialized');
        
        const sessionToInsert = {
            user_id: session.userId,
            deck_id: session.deckId,
            start_time: session.startTime,
            end_time: session.endTime,
            cards_studied: session.cardsStudied,
            correct_answers: session.correctAnswers,
            total_answers: session.totalAnswers,
            accuracy: session.accuracy,
            duration: session.duration
        };

        const { data, error } = await supabase
            .from('study_sessions')
            .insert(sessionToInsert)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            deckId: data.deck_id,
            startTime: data.start_time,
            endTime: data.end_time,
            cardsStudied: data.cards_studied,
            correctAnswers: data.correct_answers,
            totalAnswers: data.total_answers,
            accuracy: data.accuracy,
            duration: data.duration
        };
    },

    async fetchStudySessions(userId: string): Promise<StudySession[]> {
        if (!supabase) {
            console.warn('Supabase not initialized, returning empty sessions');
            return [];
        }

        const { data, error } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: false });

        if (error) {
            console.error('Error fetching study sessions:', error);
            throw error;
        }

        return (data ?? []).map(s => ({
            id: s.id,
            userId: s.user_id,
            deckId: s.deck_id,
            startTime: s.start_time,
            endTime: s.end_time,
            cardsStudied: s.cards_studied,
            correctAnswers: s.correct_answers,
            totalAnswers: s.total_answers,
            accuracy: s.accuracy,
            duration: s.duration
        }));
    }
};



