import TrackPlayer, { Event } from 'react-native-track-player';

// Store global pour le tracking (simple pour le service)
let currentTrackId = null;
let startTime = null;
let lastProgressTime = 0;
let isTrackingPaused = false;

// Fonction pour envoyer les données de tracking au store principal
const sendTrackingData = async (action, data) => {
  try {
    // Utiliser AsyncStorage ou un autre mécanisme pour communiquer avec le store
    // Pour simplifier, on log ici - dans une vraie app, utilisez un EventEmitter
    console.log('🎵 Service Tracking:', action, data);
  } catch (error) {
    console.error('Erreur tracking service:', error);
  }
};

module.exports = async function () {
  // Événements de contrôle distant
  TrackPlayer.addEventListener('remote-play', () => {
    TrackPlayer.play();
    isTrackingPaused = false;
  });
  
  TrackPlayer.addEventListener('remote-pause', () => {
    TrackPlayer.pause();
    isTrackingPaused = true;
  });
  
  TrackPlayer.addEventListener('remote-next', () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener('remote-previous', () => TrackPlayer.skipToPrevious());

  // Événements de tracking d'écoute
  TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async (event) => {
    if (event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        // Compléter le tracking précédent si nécessaire
        if (currentTrackId && startTime) {
          const duration = lastProgressTime;
          const completed = duration >= (track.duration || 0) * 0.8;
          
          await sendTrackingData('complete', {
            trackId: currentTrackId,
            duration,
            completed,
          });
        }

        // Démarrer le tracking du nouveau morceau
        currentTrackId = track.id;
        startTime = Date.now();
        lastProgressTime = 0;
        isTrackingPaused = false;

        await sendTrackingData('start', {
          trackId: track.id,
          track: {
            id: track.id,
            title: track.title,
            artist: track.artist,
            artwork: track.artwork,
            duration: track.duration,
          }
        });
      }
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
    if (event.state === 'paused' || event.state === 'stopped') {
      isTrackingPaused = true;
    } else if (event.state === 'playing') {
      isTrackingPaused = false;
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (event) => {
    if (!isTrackingPaused && currentTrackId) {
      lastProgressTime = event.position;
      
      await sendTrackingData('progress', {
        trackId: currentTrackId,
        currentTime: event.position,
        duration: event.duration,
      });
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    // Compléter le tracking du dernier morceau
    if (currentTrackId && startTime) {
      const completed = true; // Queue terminée = morceau complété
      
      await sendTrackingData('complete', {
        trackId: currentTrackId,
        duration: lastProgressTime,
        completed,
      });

      // Réinitialiser
      currentTrackId = null;
      startTime = null;
      lastProgressTime = 0;
    }
  });
};