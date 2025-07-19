# Configuration Supabase pour Robify

## 🚀 Instructions d'installation

### 1. Connexion à Supabase
1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous et sélectionnez votre projet
3. Votre projet : `acrnskrzlyzsfrkavnab`

### 2. Création des tables
1. Cliquez sur **"SQL Editor"** dans la barre latérale
2. Cliquez sur **"New Query"**
3. Copiez le contenu de `setup-supabase.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **"Run"** pour exécuter

### 3. Configuration du Storage
1. Allez dans **"Storage"** → **"Buckets"**
2. Cliquez sur **"Create bucket"**
3. Nom : `files`
4. Cochez **"Public bucket"**
5. Cliquez sur **"Create bucket"**

### 4. Politiques de Storage
1. Cliquez sur le bucket **"files"**
2. Allez dans **"Policies"**
3. Cliquez sur **"New Policy"**
4. Utilisez le contenu de `storage-policies.sql`

### 5. Vérification
Une fois terminé, vous devriez avoir :
- ✅ 14 tables créées
- ✅ Politiques RLS configurées
- ✅ Bucket "files" créé
- ✅ 4 codes d'invitation de test

## 🔧 Codes d'invitation de test
- `ROBIFY2024`
- `MUSIC123`
- `FRIENDS01`
- `TESTCODE`

## 📊 Structure des tables
- `user_profiles` - Profils utilisateurs étendus
- `invitation_codes` - Codes d'invitation privés
- `artists` - Informations des artistes
- `tracks` - Pistes musicales
- `track_versions` - Versions multiples des pistes
- `albums` - Albums et EPs
- `playlists` - Playlists collaboratives
- `comments` - Commentaires avec timestamps
- `reactions` - Likes, fire, etc.
- `friendships` - Réseau d'amis
- `collaborations` - Projets collaboratifs
- `listening_history` - Historique d'écoute

## 🛠️ Types TypeScript
Les types Supabase sont dans `types/supabase.ts` pour une intégration TypeScript complète.

## 📝 Notes importantes
- RLS (Row Level Security) est activé sur toutes les tables
- Les utilisateurs ne peuvent voir que leurs propres données privées
- Les pistes ne sont visibles que si publiées ou créées par l'utilisateur
- Les codes d'invitation sont vérifiés avant l'inscription