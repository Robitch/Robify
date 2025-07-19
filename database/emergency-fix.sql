-- Solution d'urgence : Désactiver temporairement RLS pour user_profiles
-- Exécuter ceci seulement si le fix-rls-policies.sql ne fonctionne pas

-- Désactiver RLS temporairement pour permettre la création de profils
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- OU garder RLS mais avec une politique très permissive
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Permettre insertion profil" ON user_profiles;
-- CREATE POLICY "Permettre insertion profil" ON user_profiles FOR INSERT WITH CHECK (true);