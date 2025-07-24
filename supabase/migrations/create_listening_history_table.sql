-- Migration: Create listening_history table for user listening tracking
-- Date: 2024-01-22
-- Description: Table pour tracker l'historique d'écoute des utilisateurs

-- Créer la table listening_history
CREATE TABLE listening_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  listened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  duration_listened INTEGER NOT NULL DEFAULT 0, -- en secondes
  completed BOOLEAN NOT NULL DEFAULT false, -- true si écouté jusqu'à la fin (80%+)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_listening_history_user_id ON listening_history(user_id);
CREATE INDEX idx_listening_history_track_id ON listening_history(track_id);
CREATE INDEX idx_listening_history_listened_at ON listening_history(listened_at DESC);
CREATE INDEX idx_listening_history_user_track ON listening_history(user_id, track_id);
CREATE INDEX idx_listening_history_user_date ON listening_history(user_id, listened_at DESC);
CREATE INDEX idx_listening_history_completed ON listening_history(user_id, completed) WHERE completed = true;

-- Activer Row Level Security (RLS)
ALTER TABLE listening_history ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs ne peuvent voir que leur propre historique
CREATE POLICY "Users can view their own listening history" ON listening_history
  FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent créer leur propre historique
CREATE POLICY "Users can create their own listening history" ON listening_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent mettre à jour leur propre historique
CREATE POLICY "Users can update their own listening history" ON listening_history
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent supprimer leur propre historique
CREATE POLICY "Users can delete their own listening history" ON listening_history
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_listening_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER trigger_update_listening_history_updated_at
  BEFORE UPDATE ON listening_history
  FOR EACH ROW
  EXECUTE FUNCTION update_listening_history_updated_at();

-- Vue pour les statistiques d'écoute par utilisateur
CREATE VIEW user_listening_stats AS
SELECT 
  user_id,
  COUNT(*) as total_listens,
  COUNT(DISTINCT track_id) as unique_tracks,
  SUM(duration_listened) as total_listening_time,
  AVG(duration_listened) as average_listening_time,
  COUNT(*) FILTER (WHERE completed = true) as completed_listens,
  ROUND(
    (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*)) * 100, 2
  ) as completion_rate,
  MIN(listened_at) as first_listen,
  MAX(listened_at) as last_listen,
  -- Statistiques des 30 derniers jours
  COUNT(*) FILTER (WHERE listened_at >= NOW() - INTERVAL '30 days') as listens_last_30_days,
  SUM(duration_listened) FILTER (WHERE listened_at >= NOW() - INTERVAL '30 days') as time_last_30_days,
  -- Statistiques des 7 derniers jours
  COUNT(*) FILTER (WHERE listened_at >= NOW() - INTERVAL '7 days') as listens_last_7_days,
  SUM(duration_listened) FILTER (WHERE listened_at >= NOW() - INTERVAL '7 days') as time_last_7_days,
  -- Moyenne quotidienne (30 derniers jours)
  ROUND(
    (SUM(duration_listened) FILTER (WHERE listened_at >= NOW() - INTERVAL '30 days')::DECIMAL / 30) / 60, 1
  ) as daily_average_minutes
FROM listening_history
GROUP BY user_id;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON user_listening_stats TO authenticated;

-- Vue pour l'historique avec informations des morceaux
CREATE VIEW listening_history_with_tracks AS
SELECT 
  lh.*,
  t.title,
  t.artwork_url,
  t.duration as track_duration,
  t.genre,
  t.mood,
  up.username as artist_username,
  a.title as album_title,
  -- Calculer le pourcentage écouté
  CASE 
    WHEN t.duration > 0 THEN ROUND((lh.duration_listened::DECIMAL / t.duration) * 100, 1)
    ELSE 0
  END as listen_percentage
FROM listening_history lh
JOIN tracks t ON lh.track_id = t.id
JOIN user_profiles up ON t.user_id = up.id
LEFT JOIN albums a ON t.album_id = a.id;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON listening_history_with_tracks TO authenticated;

-- Politique RLS pour la vue listening_history_with_tracks
ALTER VIEW listening_history_with_tracks SET (security_invoker = true);

-- Vue pour les morceaux les plus écoutés par utilisateur
CREATE VIEW user_top_tracks AS
SELECT 
  user_id,
  track_id,
  COUNT(*) as play_count,
  SUM(duration_listened) as total_time_listened,
  AVG(duration_listened) as average_time_per_play,
  MAX(listened_at) as last_played,
  -- Infos du morceau
  t.title,
  t.artwork_url,
  up.username as artist_username,
  a.title as album_title
FROM listening_history lh
JOIN tracks t ON lh.track_id = t.id
JOIN user_profiles up ON t.user_id = up.id
LEFT JOIN albums a ON t.album_id = a.id
GROUP BY user_id, track_id, t.title, t.artwork_url, up.username, a.title
ORDER BY user_id, play_count DESC;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON user_top_tracks TO authenticated;

-- Vue pour les artistes favoris par utilisateur
CREATE VIEW user_favorite_artists AS
SELECT 
  lh.user_id,
  t.user_id as artist_id,
  up.username as artist_username,
  COUNT(*) as play_count,
  SUM(lh.duration_listened) as total_time_listened,
  COUNT(DISTINCT lh.track_id) as unique_tracks_played,
  MAX(lh.listened_at) as last_played
FROM listening_history lh
JOIN tracks t ON lh.track_id = t.id
JOIN user_profiles up ON t.user_id = up.id
GROUP BY lh.user_id, t.user_id, up.username
ORDER BY lh.user_id, total_time_listened DESC;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON user_favorite_artists TO authenticated;

-- Fonction pour nettoyer l'historique ancien (plus de X jours)
CREATE OR REPLACE FUNCTION cleanup_old_listening_history(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM listening_history 
  WHERE listened_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'écoute d'un utilisateur pour une période
CREATE OR REPLACE FUNCTION get_user_listening_stats_for_period(
  target_user_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_listens BIGINT,
  unique_tracks BIGINT,
  total_time INTEGER,
  average_time NUMERIC,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_listens,
    COUNT(DISTINCT track_id)::BIGINT as unique_tracks,
    SUM(duration_listened)::INTEGER as total_time,
    AVG(duration_listened) as average_time,
    ROUND(
      (COUNT(*) FILTER (WHERE completed = true)::DECIMAL / COUNT(*)) * 100, 2
    ) as completion_rate
  FROM listening_history
  WHERE user_id = target_user_id 
    AND listened_at >= start_date 
    AND listened_at <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE listening_history IS 'Historique d''écoute des utilisateurs avec tracking détaillé';
COMMENT ON COLUMN listening_history.duration_listened IS 'Durée réellement écoutée en secondes';
COMMENT ON COLUMN listening_history.completed IS 'True si le morceau a été écouté à plus de 80%';
COMMENT ON VIEW user_listening_stats IS 'Statistiques d''écoute agrégées par utilisateur';
COMMENT ON VIEW listening_history_with_tracks IS 'Historique d''écoute avec informations complètes des morceaux';
COMMENT ON VIEW user_top_tracks IS 'Morceaux les plus écoutés par utilisateur';
COMMENT ON VIEW user_favorite_artists IS 'Artistes favoris par utilisateur basé sur le temps d''écoute';
COMMENT ON FUNCTION cleanup_old_listening_history IS 'Nettoie l''historique d''écoute plus ancien que X jours';
COMMENT ON FUNCTION get_user_listening_stats_for_period IS 'Retourne les statistiques d''écoute pour une période donnée';