import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, ScrollView } from 'react-native';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth } from '../../src/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

type Pati = {
  id: string;
  name: string | null;
  healthStatus: string;
  imageUrl: string;
  createdAt: any;
  userId: string;
  hasFood: boolean;
  notes: string | null;
  location: {
    latitude: number;
    longitude: number;
  };
};

export default function PatilerimScreen() {
  const [patiler, setPatiler] = useState<Pati[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPati, setSelectedPati] = useState<Pati | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatiler = async () => {
    try {
      console.log('Patiler yükleniyor...');
      const userId = auth.currentUser?.uid;
      console.log('Current User ID:', userId);

      if (!userId) {
        console.log('Kullanıcı oturum açmamış');
        setPatiler([]);
        return;
      }

      const patilerRef = collection(db, 'patiler');
      console.log('Firestore collection referansı alındı');

      const q = query(
        patilerRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      console.log('Query oluşturuldu');

      const querySnapshot = await getDocs(q);
      console.log('Query sonuçları alındı, döküman sayısı:', querySnapshot.size);

      const patiList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Döküman verisi:', data);
        return {
          id: doc.id,
          ...data
        };
      }) as Pati[];

      console.log('İşlenmiş pati listesi:', patiList);
      setPatiler(patiList);
    } catch (error) {
      console.error('Patiler yüklenirken hata:', error);
      Alert.alert(
        'Hata',
        'Patiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
      );
      setPatiler([]);
      setError('Patiler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Ekran her odaklandığında verileri yenile
  useFocusEffect(
    useCallback(() => {
      console.log('Ekran odaklandı, veriler yenileniyor...');
      fetchPatiler();
    }, [])
  );

  const onRefresh = useCallback(() => {
    console.log('Manuel yenileme başlatıldı');
    setRefreshing(true);
    fetchPatiler();
  }, []);

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
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

  const getHealthStatusColor = (status: string) => {
    switch (status) {
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

  const getHealthStatusText = (status: string) => {
    switch (status) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patilerim</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : patiler.length === 0 ? (
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 8,
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
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
    padding: 20,
    maxHeight: '80%',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  modalDetails: {
    marginTop: 15,
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  foodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  foodText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
  },
  notesContainer: {
    marginTop: 10,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 