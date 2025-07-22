# 📚 MA BIBLIOTHÈQUE - PLAN DE DÉVELOPPEMENT

## 🎯 Vue d'ensemble

Développer un système complet de bibliothèque personnelle permettant aux utilisateurs de gérer leurs favoris, téléchargements offline, historique d'écoute et statistiques personnalisées.

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Structure des fichiers

```
app/(tabs)/library/
├── index.tsx              # Page principale Ma Bibliothèque
├── favorites.tsx          # Morceaux favoris
├── downloads.tsx          # Téléchargements offline
├── history.tsx            # Historique d'écoute
└── recently-played.tsx    # Récemment joués

components/library/
├── LibraryStats.tsx       # Statistiques d'écoute
├── FavoriteButton.tsx     # Bouton favori animé
├── DownloadButton.tsx     # Bouton téléchargement
├── DownloadManager.tsx    # Gestionnaire de téléchargements
├── RecentlyPlayed.tsx     # Liste récente
├── ListeningStats.tsx     # Graphiques de stats
├── GenreChart.tsx         # Répartition par genre
└── LibrarySearch.tsx      # Recherche dans la bibliothèque

store/
├── libraryStore.tsx       # État global bibliothèque
├── favoritesStore.tsx     # Gestion des favoris
└── offlineStore.tsx       # Gestion des téléchargements
```

---

## 📋 PHASES DE DÉVELOPPEMENT

### Phase 1: Foundation (Semaine 1)

#### 1.1 Stores Zustand

```ts
// store/libraryStore.tsx
interface LibraryStore {
  recentlyPlayed: Track[]
  listeningStats: LibraryStats
  addToRecent: (track: Track) => void
  updateListeningStats: (track: Track, duration: number) => void
  getTopGenres: () => string[]
  getTopArtists: () => string[]
  getTotalListeningTime: () => number
}

// store/favoritesStore.tsx
interface FavoritesStore {
  favorites: Set<string> // Track IDs
  favoritesTracks: Track[]
  isLoading: boolean
  addFavorite: (track: Track) => Promise<void>
  removeFavorite: (trackId: string) => Promise<void>
  isFavorite: (trackId: string) => boolean
  loadFavorites: () => Promise<void>
}

// store/offlineStore.tsx
interface OfflineStore {
  downloads: Map<string, DownloadedTrack>
  downloading: Set<string>
  downloadProgress: Map<string, number>
  downloadTrack: (track: Track) => Promise<void>
  deleteDownload: (trackId: string) => Promise<void>
  isTrackDownloaded: (trackId: string) => boolean
  getDownloadProgress: (trackId: string) => number
}
```

#### 1.2 Types TypeScript

```ts
interface LibraryStats {
  totalTracks: number
  totalPlaytime: number // en secondes
  favoriteGenres: { genre: string; count: number }[]
  topArtists: { artist: string; playCount: number }[]
  listeningStreak: number // jours consécutifs
  thisWeekMinutes: number
  thisMonthMinutes: number
}

interface DownloadedTrack extends Track {
  downloadedAt: string
  localPath: string
  fileSize: number
  isDownloading?: boolean
  downloadProgress?: number
}

interface ListeningSession {
  trackId: string
  startTime: Date
  duration: number
  completed: boolean
}
```

---

### Phase 2: Page Principale (Semaine 1)

#### 2.1 Écran Ma Bibliothèque (`app/(tabs)/library/index.tsx`)

```tsx
export default function LibraryScreen() {
  return (
    <ScrollView>
      {/* Header avec avatar et stats rapides */}
      <LibraryHeader />

      {/* Statistiques visuelles */}
      <LibraryStats />

      {/* Grille d'accès rapide */}
      <QuickAccessGrid>
        - Favoris (avec compteur)
        - Téléchargements (avec espace utilisé)
        - Historique (avec temps total)
      </QuickAccessGrid>

      {/* Récemment joués */}
      <RecentlyPlayed />

      {/* Genres favoris */}
      <FavoriteGenres />
    </ScrollView>
  )
}
```

#### 2.2 Composants Principaux

- **LibraryHeader** : Header avec photo de profil et stats rapides
- **QuickAccessGrid** : Grille 2x2 de raccourcis
- **StatCard** : Carte de statistique réutilisable

---

### Phase 3: Système de Favoris (Semaine 1-2)

#### 3.1 Backend Supabase

- Utiliser la table `reactions` existante
- `reaction_type = 'favorite'` pour les favoris

```sql
SELECT * FROM reactions
WHERE user_id = $1 AND reaction_type = 'favorite';

-- Requête pour récupérer les favoris avec détails
SELECT t.*, r.created_at as favorited_at
FROM tracks t
INNER JOIN reactions r ON t.id = r.track_id
WHERE r.user_id = $1 AND r.reaction_type = 'favorite'
ORDER BY r.created_at DESC;
```

#### 3.2 Composants Favoris

- **FavoriteButton** : Bouton cœur avec animation
- **FavoritesList** : Liste des morceaux favoris avec tri
- Intégration dans les composants MusicItem existants

#### 3.3 Page Favoris (`app/(tabs)/library/favorites.tsx`)

Fonctionnalités :
- Liste des tracks favorites
- Recherche dans les favoris
- Tri par : date ajoutée, nom, artiste
- Lecture de tous les favoris
- Actions : retirer des favoris, télécharger

---

### Phase 4: Téléchargements Offline (Semaine 2)

#### 4.1 Système de Cache

```ts
// hooks/useOfflineDownload.ts
const useOfflineDownload = () => {
  const downloadTrack = async (track: Track) => {
    const fileName = `${track.id}.mp3`
    const localUri = `${FileSystem.documentDirectory}music/${fileName}`

    // Créer le dossier si nécessaire
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}music/`,
      { intermediates: true }
    )

    // Télécharger avec progress
    const downloadResult = await FileSystem.createDownloadResumable(
      track.file_url,
      localUri,
      {},
      (progress) => {
        const percent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite
        updateDownloadProgress(track.id, percent * 100)
      }
    ).downloadAsync()

    // Sauvegarder les métadonnées
    await saveDownloadMetadata(track, localUri, downloadResult.headers)
  }

  return { downloadTrack, deleteDownload, isDownloaded }
}
```

#### 4.2 Page Téléchargements (`app/(tabs)/library/downloads.tsx`)

Fonctionnalités :
- Liste des tracks téléchargées
- Indicateur d'espace utilisé
- Gestion des téléchargements (pause, reprendre, annuler)
- Suppression de téléchargements
- Mode offline : afficher uniquement les tracks dispo

#### 4.3 Composants

- **DownloadButton** : Bouton avec états (télécharger, en cours, téléchargé)
- **DownloadManager** : Gestionnaire global de téléchargements
- **StorageIndicator** : Barre d'espace utilisé

---

### Phase 5: Historique & Statistiques (Semaine 2-3)

#### 5.1 Tracking d'Écoute

```ts
// hooks/useListeningTracker.ts
const useListeningTracker = () => {
  const trackListening = (track: Track) => {
    const session = {
      trackId: track.id,
      startTime: new Date(),
      userId: user.id
    }

    // Sauvegarder en local d'abord (pour l'offline)
    saveListeningSession(session)
  }

  const completeListening = (trackId: string, duration: number) => {
    // Mettre à jour Supabase
    supabase.from('listening_history').insert({
      track_id: trackId,
      user_id: user.id,
      duration_listened: duration,
      completed: duration > track.duration * 0.8,
      listened_at: new Date()
    })
  }
}
```

#### 5.2 Page Historique (`app/(tabs)/library/history.tsx`)

Fonctionnalités :
- Historique chronologique
- Groupement par jour/semaine
- Filtres par période
- Statistiques de la période
- Recherche dans l'historique

#### 5.3 Composants Statistiques

- **ListeningStats** : Graphiques de temps d'écoute
- **GenreChart** : Répartition par genres (camembert)
- **TopArtists** : Liste des artistes les plus écoutés
- **ListeningStreak** : Indicateur de série d'écoute

---

### Phase 6: Recherche & Optimisations (Semaine 3)

#### 6.1 Recherche Unifiée

```ts
// components/library/LibrarySearch.tsx
interface SearchFilters {
  query?: string
  scope: 'all' | 'favorites' | 'downloads' | 'history'
  genre?: string[]
  dateRange?: [Date, Date]
  sortBy: 'name' | 'date' | 'playCount'
}

const LibrarySearch = () => {
  // Recherche dans favoris, téléchargements, historique
  // Suggestions basées sur l'historique
  // Recherche instantanée (debounced)
}
```

#### 6.2 Optimisations

- Cache intelligent des requêtes
- Pagination pour les grandes listes
- Images lazy loading
- Synchronisation en arrière-plan

---

## 🎨 DESIGN UX/UI

### Navigation

Ma Bibliothèque (tab principale avec badge de stats)
- Vue d'ensemble (page principale)
- Favoris (avec compteur)
- Téléchargements (avec indicateur d'espace)
- Historique (avec temps total)

### Composants Visuels

- Cards statistiques avec icônes et couleurs
- Graphiques simples (barres, camembert) avec react-native-svg
- Boutons d'action avec animations et feedback tactile
- Indicateurs de progression pour téléchargements
- États vides attrayants avec call-to-action

### Animations

- Transition entre favoris/non-favoris (cœur qui bat)
- Progress bars pour téléchargements
- Skeleton loading pour les listes
- Swipe actions (retirer favoris, supprimer téléchargement)

---

## 📊 BASE DE DONNÉES

### Tables Supabase Existantes

- `reactions` : Pour les favoris (`reaction_type = 'favorite'`)
- `listening_history` : Historique d'écoute

### Nouvelle table à ajouter

```sql
-- Cache des téléchargements
CREATE TABLE downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  local_path TEXT NOT NULL,
  file_size BIGINT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- RLS Policy
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own downloads" ON downloads
FOR ALL USING (auth.uid() = user_id);
```

#### Vues utiles (optionnel)

```sql
-- Vue des statistiques utilisateur
CREATE VIEW user_library_stats AS
SELECT
  user_id,
  COUNT(DISTINCT track_id) as total_favorites,
  COUNT(DISTINCT CASE WHEN reaction_type = 'favorite' THEN track_id END) as favorites_count
  -- Plus de stats...
FROM reactions
GROUP BY user_id;
```

---

## 🚀 INTÉGRATIONS

### Avec l'existant

- Intégrer `FavoriteButton` dans tous les MusicItem
- Étendre le player pour tracker automatiquement l'écoute
- Utiliser le système de Track/TrackVersion existant
- S'appuyer sur les stores Zustand actuels

#### Player Integration

```ts
// Dans le player existant, ajouter :
const onTrackStart = (track) => {
  libraryStore.addToRecent(track)
  startListeningSession(track)
}

const onTrackEnd = (track, duration) => {
  completeListeningSession(track.id, duration)
  libraryStore.updateListeningStats(track, duration)
}
```

---

## ⏱️ TIMELINE DÉTAILLÉE

### Semaine 1

- Jour 1-2 : Stores Zustand + Types TypeScript
- Jour 3-4 : Page principale Ma Bibliothèque
- Jour 5-7 : Système de favoris complet

### Semaine 2

- Jour 1-3 : Système de téléchargements offline
- Jour 4-5 : Intégration dans le player existant
- Jour 6-7 : Page téléchargements

### Semaine 3

- Jour 1-3 : Historique et statistiques
- Jour 4-5 : Recherche et filtres
- Jour 6-7 : Polish UX/UI et animations

**Estimation totale : 3 semaines**
