import { create } from 'zustand';
import { Track } from '@/types';
import { supabase } from '@/lib/supabase';

type ReactionType = 'like' | 'fire' | 'heart' | 'mind_blown';

interface FavoriteTrack extends Track {
  reaction_type: ReactionType;
  favorited_at: string;
}

interface FavoritesStore {
  // État
  isLoading: boolean;
  error: string | null;
  favoriteTracksIds: Set<string>;
  favoriteTracks: FavoriteTrack[];
  favoritesByType: Record<ReactionType, FavoriteTrack[]>;
  
  // Actions principales
  initializeFavorites: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  
  // Actions de gestion des favoris
  addToFavorites: (trackId: string, reactionType?: ReactionType) => Promise<void>;
  removeFromFavorites: (trackId: string, reactionType?: ReactionType) => Promise<void>;
  toggleFavorite: (trackId: string, reactionType?: ReactionType) => Promise<void>;
  updateReactionType: (trackId: string, newReactionType: ReactionType) => Promise<void>;
  
  // Actions de requête
  isFavorite: (trackId: string) => boolean;
  getFavoriteReactionType: (trackId: string) => ReactionType | null;
  getFavoritesByType: (type: ReactionType) => FavoriteTrack[];
  searchFavorites: (query: string) => FavoriteTrack[];
  
  // Utilitaires
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  // État initial
  isLoading: false,
  error: null,
  favoriteTracksIds: new Set(),
  favoriteTracks: [],
  favoritesByType: {
    like: [],
    fire: [],
    heart: [],
    mind_blown: [],
  },

  // Actions principales
  initializeFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('reactions')
        .select(`
          *,
          tracks (
            *,
            user_profiles(username),
            albums (
              title
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const favoriteTracksIds = new Set<string>();
      const favoriteTracks: FavoriteTrack[] = [];
      const favoritesByType: Record<ReactionType, FavoriteTrack[]> = {
        like: [],
        fire: [],
        heart: [],
        mind_blown: [],
      };

      data?.forEach(reaction => {
        if (reaction.tracks) {
          const favoriteTrack: FavoriteTrack = {
            ...reaction.tracks as Track,
            reaction_type: reaction.reaction_type as ReactionType,
            favorited_at: reaction.created_at,
          };

          favoriteTracksIds.add(reaction.track_id);
          favoriteTracks.push(favoriteTrack);
          favoritesByType[reaction.reaction_type as ReactionType].push(favoriteTrack);
        }
      });

      set({
        favoriteTracksIds,
        favoriteTracks,
        favoritesByType,
        isLoading: false,
      });

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des favoris',
        isLoading: false,
      });
    }
  },

  refreshFavorites: async () => {
    await get().initializeFavorites();
  },

  // Actions de gestion des favoris
  addToFavorites: async (trackId: string, reactionType: ReactionType = 'like') => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Vérifier si le morceau existe déjà dans les favoris
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .single();

      if (existingReaction) {
        // Si une réaction existe déjà, la mettre à jour
        await get().updateReactionType(trackId, reactionType);
        return;
      }

      // Créer une nouvelle réaction
      const { error } = await supabase
        .from('reactions')
        .insert({
          user_id: user.id,
          track_id: trackId,
          reaction_type: reactionType,
        });

      if (error) throw error;

      // Rafraîchir les favoris
      await get().refreshFavorites();

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout aux favoris',
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  removeFromFavorites: async (trackId: string, reactionType?: ReactionType) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      let query = supabase
        .from('reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      // Si un type de réaction spécifique est fourni, ne supprimer que cette réaction
      if (reactionType) {
        query = query.eq('reaction_type', reactionType);
      }

      const { error } = await query;

      if (error) throw error;

      // Rafraîchir les favoris
      await get().refreshFavorites();

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression des favoris',
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (trackId: string, reactionType: ReactionType = 'like') => {
    const isFav = get().isFavorite(trackId);
    
    if (isFav) {
      await get().removeFromFavorites(trackId, reactionType);
    } else {
      await get().addToFavorites(trackId, reactionType);
    }
  },

  updateReactionType: async (trackId: string, newReactionType: ReactionType) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('reactions')
        .update({ reaction_type: newReactionType })
        .eq('user_id', user.id)
        .eq('track_id', trackId);

      if (error) throw error;

      // Rafraîchir les favoris
      await get().refreshFavorites();

    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la réaction',
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Actions de requête
  isFavorite: (trackId: string) => {
    const { favoriteTracksIds } = get();
    return favoriteTracksIds.has(trackId);
  },

  getFavoriteReactionType: (trackId: string) => {
    const { favoriteTracks } = get();
    const favoriteTrack = favoriteTracks.find(track => track.id === trackId);
    return favoriteTrack ? favoriteTrack.reaction_type : null;
  },

  getFavoritesByType: (type: ReactionType) => {
    const { favoritesByType } = get();
    return favoritesByType[type] || [];
  },

  searchFavorites: (query: string) => {
    const { favoriteTracks } = get();
    
    if (!query.trim()) {
      return favoriteTracks;
    }

    return favoriteTracks.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.user_profiles?.username.toLowerCase().includes(query.toLowerCase()) ||
      track.genre?.toString().toLowerCase().includes(query.toLowerCase()) ||
      track.mood?.join(' ').toLowerCase().includes(query.toLowerCase())
    );
  },

  // Utilitaires
  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));