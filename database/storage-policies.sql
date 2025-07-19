-- Politiques de Storage pour Supabase
-- À appliquer dans Storage > Policies

-- 1. Politique pour permettre l'upload de fichiers
CREATE POLICY "Authenticated users can upload files" ON storage.objects 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. Politique pour permettre la lecture de fichiers
CREATE POLICY "Anyone can view files" ON storage.objects 
FOR SELECT USING (bucket_id = 'files');

-- 3. Politique pour permettre la mise à jour de fichiers
CREATE POLICY "Users can update their own files" ON storage.objects 
FOR UPDATE USING (auth.uid()::text = owner);

-- 4. Politique pour permettre la suppression de fichiers
CREATE POLICY "Users can delete their own files" ON storage.objects 
FOR DELETE USING (auth.uid()::text = owner);