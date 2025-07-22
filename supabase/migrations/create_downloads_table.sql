-- Migration: Create downloads table for offline storage tracking
-- Date: 2024-01-22
-- Description: Table pour gérer les téléchargements offline des utilisateurs

-- Créer la table downloads
CREATE TABLE downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  local_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  download_quality TEXT DEFAULT 'standard' CHECK (download_quality IN ('standard', 'high', 'lossless')),
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité : un utilisateur ne peut télécharger qu'une fois le même morceau
  UNIQUE(user_id, track_id)
);

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_track_id ON downloads(track_id);
CREATE INDEX idx_downloads_downloaded_at ON downloads(downloaded_at DESC);
CREATE INDEX idx_downloads_file_size ON downloads(file_size);

-- Activer Row Level Security (RLS)
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs ne peuvent voir que leurs propres téléchargements
CREATE POLICY "Users can view their own downloads" ON downloads
  FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent créer leurs propres téléchargements
CREATE POLICY "Users can create their own downloads" ON downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent mettre à jour leurs propres téléchargements
CREATE POLICY "Users can update their own downloads" ON downloads
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique RLS : Les utilisateurs peuvent supprimer leurs propres téléchargements
CREATE POLICY "Users can delete their own downloads" ON downloads
  FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_downloads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER trigger_update_downloads_updated_at
  BEFORE UPDATE ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_downloads_updated_at();

-- Vue pour les statistiques de téléchargement par utilisateur
CREATE VIEW user_download_stats AS
SELECT 
  user_id,
  COUNT(*) as total_downloads,
  SUM(file_size) as total_size,
  AVG(file_size) as average_file_size,
  MIN(downloaded_at) as first_download,
  MAX(downloaded_at) as last_download,
  COUNT(CASE WHEN download_quality = 'standard' THEN 1 END) as standard_quality_count,
  COUNT(CASE WHEN download_quality = 'high' THEN 1 END) as high_quality_count,
  COUNT(CASE WHEN download_quality = 'lossless' THEN 1 END) as lossless_quality_count
FROM downloads
GROUP BY user_id;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON user_download_stats TO authenticated;

-- Vue pour les téléchargements avec informations des morceaux
CREATE VIEW downloads_with_tracks AS
SELECT 
  d.*,
  t.title,
  t.artwork_url,
  t.duration,
  t.genre,
  t.mood,
  up.username as artist_username,
  a.title as album_title
FROM downloads d
JOIN tracks t ON d.track_id = t.id
JOIN user_profiles up ON t.user_id = up.id
LEFT JOIN albums a ON t.album_id = a.id;

-- Donner accès à la vue aux utilisateurs authentifiés
GRANT SELECT ON downloads_with_tracks TO authenticated;

-- Politique RLS pour la vue downloads_with_tracks
ALTER VIEW downloads_with_tracks SET (security_invoker = true);

-- Commentaires pour la documentation
COMMENT ON TABLE downloads IS 'Table pour stocker les métadonnées des téléchargements offline des utilisateurs';
COMMENT ON COLUMN downloads.local_path IS 'Chemin local du fichier téléchargé sur l''appareil';
COMMENT ON COLUMN downloads.file_size IS 'Taille du fichier en bytes';
COMMENT ON COLUMN downloads.download_quality IS 'Qualité du téléchargement (standard, high, lossless)';
COMMENT ON VIEW user_download_stats IS 'Statistiques de téléchargement par utilisateur';
COMMENT ON VIEW downloads_with_tracks IS 'Vue combinant downloads avec les informations des morceaux';