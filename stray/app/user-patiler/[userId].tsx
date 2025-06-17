import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Pati = {
  id: string;
  name: string | null;
  healthStatus: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  hasFood: boolean;
  notes: string | null;
  userId?: string;
};

export default function UserPatilerScreen() {
  const { userId } = useLocalSearchParams();
  const [patiler, setPatiler] = useState<Pati[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPati, setSelectedPati] = useState<Pati | null>(null);

  useEffect(() => {
    fetchUserPatiler();
  }, [userId]);

  const fetchUserPatiler = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(
        query(
          collection(db, 'patiler'),
          where('userId', '==', userId)
        )
      );
      const patiList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pati[];
      setPatiler(patiList);
    } catch (error) {
      console.error('Kullanıcının patileri yüklenirken hata:', error);
      setError('Patiler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sağlıklı':
        return '#4CAF50';
      case 'hasta':
        return '#FF6B6B';
      case 'yaralı':
        return '#FFA000';
      default:
        return '#9E9E9E';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sağlıklı':
        return 'checkmark-circle';
      case 'hasta':
        return 'medical';
      case 'yaralı':
        return 'bandage';
      default:
        return 'help-circle';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sağlıklı':
        return 'Sağlıklı';
      case 'hasta':
        return 'Hasta';
      case 'yaralı':
        return 'Yaralı';
      default:
        return status;
    }
  };

  const renderPatiCard = ({ item }: { item: Pati }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedPati(item);
        setModalVisible(true);
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.name || 'İsimsiz Pati'}</Text>
        <View style={styles.healthStatus}>
          <Ionicons
            name={getHealthStatusIcon(item.healthStatus)}
            size={20}
            color={getHealthStatusColor(item.healthStatus)}
          />
          <Text style={[styles.healthText, { color: getHealthStatusColor(item.healthStatus) }]}>
            {getHealthStatusText(item.healthStatus)}
          </Text>
        </View>
        {item.hasFood && (
          <View style={styles.foodStatus}>
            <Ionicons name="restaurant" size={20} color="#4CAF50" />
            <Text style={styles.foodText}>Etrafında yemek var</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: '/(tabs)',
            params: { selectedPatiId: patiler[0]?.id }
          })} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FF6B6B" />
        </TouchableOpacity>
        <Text style={styles.title}>Kullanıcının Diğer Patileri</Text>
      </View>

      {patiler.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Henüz pati eklenmemiş</Text>
        </View>
      ) : (
        <FlatList
          data={patiler}
          renderItem={renderPatiCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedPati && (
              <>
                <Image
                  source={{ uri: selectedPati.imageUrl }}
                  style={styles.modalImage}
                />
                <ScrollView style={styles.modalDetails}>
                  <Text style={styles.modalName}>
                    {selectedPati.name || 'İsimsiz Pati'}
                  </Text>
                  
                  <View style={styles.healthStatus}>
                    <Ionicons
                      name={getHealthStatusIcon(selectedPati.healthStatus)}
                      size={24}
                      color={getHealthStatusColor(selectedPati.healthStatus)}
                    />
                    <Text style={[styles.healthText, { color: getHealthStatusColor(selectedPati.healthStatus) }]}>
                      {getHealthStatusText(selectedPati.healthStatus)}
                    </Text>
                  </View>

                  {selectedPati.hasFood && (
                    <View style={styles.foodStatus}>
                      <Ionicons name="restaurant" size={24} color="#4CAF50" />
                      <Text style={styles.foodText}>Etrafında yemek var</Text>
                    </View>
                  )}

                  {selectedPati.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notlar:</Text>
                      <Text style={styles.notesText}>{selectedPati.notes}</Text>
                    </View>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Kapat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 10,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  healthText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  foodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  modalDetails: {
    marginTop: 12,
    paddingBottom: 8,
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 