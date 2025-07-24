import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Ionicons } from '@expo/vector-icons'; 
import { useHistoryStore } from '@/store/historyStore';
import { supabase } from '@/lib/supabase';

export const TestTrackingButton: React.FC = () => {
  const { initializeHistory, calculateStats } = useHistoryStore();

  const addTestHistoryEntries = async () => {
    try {
      console.log('🧪 Ajout d\'entrées de test dans l\'historique...');
      
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Utilisateur non connecté');
        return;
      }

      console.log('👤 Utilisateur connecté:', user.id);

      // Ajouter directement dans Supabase listening_history
      const testEntries = [
        {
          user_id: user.id,
          track_id: 'test-track-1',
          listened_at: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h
          duration_listened: 150,
          completed: true,
        },
        {
          user_id: user.id,
          track_id: 'test-track-2', 
          listened_at: new Date(Date.now() - 7200000).toISOString(), // Il y a 2h
          duration_listened: 220,
          completed: true,
        },
        {
          user_id: user.id,
          track_id: 'test-track-3',
          listened_at: new Date(Date.now() - 10800000).toISOString(), // Il y a 3h
          duration_listened: 80,
          completed: false,
        },
        {
          user_id: user.id,
          track_id: 'test-track-1',
          listened_at: new Date().toISOString(), // Maintenant
          duration_listened: 180,
          completed: true,
        }
      ];

      console.log('📝 Insertion des entrées de test...');
      
      const { data, error } = await supabase
        .from('listening_history')
        .insert(testEntries)
        .select();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Entrées insérées:', data);

      // Rafraîchir l'historique local
      await initializeHistory();
      await calculateStats();
      
      console.log('🎉 Entrées de test ajoutées avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout des entrées de test:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={addTestHistoryEntries}
      className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center mx-4 my-2"
    >
      <Ionicons name="flask" size={20} color="white" />
      <Text className="text-white font-medium ml-2">
        Ajouter des données de test
      </Text>
    </TouchableOpacity>
  );
};