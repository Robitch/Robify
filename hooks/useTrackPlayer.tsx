import { useState, useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import { supabase } from '@/lib/supabase';
import { Track, TrackVersion, VersionType } from '@/types';

export interface UseTrackPlayerResult {
  playTrack: (track: Track, specificVersion?: TrackVersion) => Promise<void>;
  playVersion: (track: Track, version: TrackVersion) => Promise<void>;
  getDefaultVersion: (trackId: string) => Promise<TrackVersion | null>;
  loading: boolean;
}

export const useTrackPlayer = (): UseTrackPlayerResult => {
  const [loading, setLoading] = useState(false);

  // Récupérer la version par défaut d'un track
  const getDefaultVersion = useCallback(async (trackId: string): Promise<TrackVersion | null> => {
    try {
      const { data: versions, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error || !versions || versions.length === 0) {
        return null;
      }

      // Type cast version_type to VersionType enum
      const typedVersions = versions.map(version => ({
        ...version,
        version_type: version.version_type as VersionType
      })) as TrackVersion[];

      // Retourner la version primaire ou la dernière créée
      return typedVersions.find(v => v.is_primary) || typedVersions[0];
    } catch (error) {
      console.error('Error getting default version:', error);
      return null;
    }
  }, []);

  // Jouer une version spécifique
  const playVersion = useCallback(async (track: Track, version: TrackVersion) => {
    setLoading(true);
    try {
      const trackData = {
        id: `${track.id}_${version.id}`,
        url: version.file_url,
        title: `${track.title} (${version.version_name})`,
        artist: track.user_profiles?.full_name || 'Unknown Artist',
        artwork: track.artwork_url || undefined,
      };

      // Vérifier l'état actuel
      const currentActiveTrack = await TrackPlayer.getCurrentTrack();
      const state = await TrackPlayer.getState();
      
      // Si c'est la même version, juste pause/play
      if (currentActiveTrack !== null) {
        const currentTrackData = await TrackPlayer.getTrack(currentActiveTrack);
        if (currentTrackData?.url === version.file_url) {
          if (state === 'playing') {
            await TrackPlayer.pause();
          } else {
            await TrackPlayer.play();
          }
          return;
        }
      }
      
      // Charger la nouvelle version
      await TrackPlayer.reset();
      await TrackPlayer.add(trackData);
      await TrackPlayer.play();

    } catch (error) {
      console.error('Error playing version:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Jouer un track avec version automatique
  const playTrack = useCallback(async (track: Track, specificVersion?: TrackVersion) => {
    setLoading(true);
    try {
      // Si une version spécifique est fournie, l'utiliser
      if (specificVersion) {
        return await playVersion(track, specificVersion);
      }

      // Sinon, récupérer la version par défaut
      const defaultVersion = await getDefaultVersion(track.id);
      
      if (defaultVersion) {
        return await playVersion(track, defaultVersion);
      }

      // Fallback: jouer le fichier original
      const trackData = {
        id: track.id,
        url: track.file_url,
        title: track.title,
        artist: track.user_profiles?.full_name || 'Unknown Artist',
        artwork: track.artwork_url || undefined,
      };

      // Vérifier l'état actuel
      const currentActiveTrack = await TrackPlayer.getCurrentTrack();
      const state = await TrackPlayer.getState();
      
      // Si c'est la même track, juste pause/play
      if (currentActiveTrack !== null) {
        const currentTrackData = await TrackPlayer.getTrack(currentActiveTrack);
        if (currentTrackData?.url === track.file_url) {
          if (state === 'playing') {
            await TrackPlayer.pause();
          } else {
            await TrackPlayer.play();
          }
          return;
        }
      }
      
      // Charger la nouvelle track
      await TrackPlayer.reset();
      await TrackPlayer.add(trackData);
      await TrackPlayer.play();

    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getDefaultVersion, playVersion]);

  return {
    playTrack,
    playVersion,
    getDefaultVersion,
    loading,
  };
};