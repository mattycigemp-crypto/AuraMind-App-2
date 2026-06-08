// Anki Integration Service for AuraMind
// Handles tracking Anki import statistics

class AnkiService {
  async updateAnkiImportStats(cardCount: number): Promise<void> {
    try {
      const { supabase } = await import('../database/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};

      await supabase.auth.updateUser({
        data: {
          user_metadata: {
            ...metadata,
            integrations: {
              ...integrations,
              anki: {
                connected: true,
                lastImportAt: Date.now(),
                importCount: (integrations.anki?.importCount || 0) + cardCount
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to update Anki import stats:', error);
    }
  }

  async getImportStats() {
    try {
      const { supabase } = await import('../database/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          connected: false,
          lastImportAt: undefined,
          importCount: 0
        };
      }

      const metadata = user.user_metadata || {};
      return metadata?.integrations?.anki || {
        connected: false,
        lastImportAt: undefined,
        importCount: 0
      };
    } catch (error) {
      console.error('Failed to get Anki import stats:', error);
      return {
        connected: false,
        lastImportAt: undefined,
        importCount: 0
      };
    }
  }
}

export const ankiService = new AnkiService();


