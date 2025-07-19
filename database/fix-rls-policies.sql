-- Fix RLS policies pour la création de profils utilisateurs
-- Exécutez ce script dans le SQL Editor de Supabase

-- 1. Supprimer les anciennes politiques user_profiles
DROP POLICY IF EXISTS "Tout le monde peut voir les profils" ON user_profiles;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leur profil" ON user_profiles;
DROP POLICY IF EXISTS "Utilisateurs peuvent créer leur profil" ON user_profiles;

-- 2. Créer des nouvelles politiques plus permissives pour la création
CREATE POLICY "Tout le monde peut voir les profils publics" ON user_profiles 
FOR SELECT USING (true);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur propre profil" ON user_profiles 
FOR UPDATE USING (auth.uid() = id);

-- IMPORTANT: Politique plus permissive pour l'inscription
CREATE POLICY "Utilisateurs authentifiés peuvent créer leur profil" ON user_profiles 
FOR INSERT WITH CHECK (
  auth.uid() = id AND 
  auth.role() = 'authenticated'
);

-- 3. Alternative: Politique encore plus permissive si la première ne fonctionne pas
-- CREATE POLICY "Permettre insertion profil" ON user_profiles 
-- FOR INSERT WITH CHECK (true);

-- 4. Vérifier que RLS est activé
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;