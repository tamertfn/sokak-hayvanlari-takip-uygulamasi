import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, ScrollView, TextInput } from 'react-native';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth } from '../../src/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';

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
  const { editId } = useLocalSearchParams();
  const [patiler, setPatiler] = useState<Pati[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPati, setSelectedPati] = useState<Pati | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    healthStatus: '',
    notes: '',
    hasFood: false
  });

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

  useEffect(() => {
    if (editId) {
      const pati = patiler.find(p => p.id === editId);
      if (pati) {
        setSelectedPati(pati);
        setEditForm({
          name: pati.name || '',
          healthStatus: pati.healthStatus,
          notes: pati.notes || '',
          hasFood: pati.hasFood
        });
        setEditModalVisible(true);
      }
    }
  }, [editId, patiler]);

  const handleEdit = async () => {
    if (!selectedPati) return;

    try {
      const patiRef = doc(db, 'patiler', selectedPati.id);
      await updateDoc(patiRef, {
        name: editForm.name,
        healthStatus: editForm.healthStatus,
        notes: editForm.notes,
        hasFood: editForm.hasFood,
        updatedAt: new Date()
      });

      Alert.alert('Başarılı', 'Pati bilgileri güncellendi');
      setEditModalVisible(false);
      fetchPatiler();
    } catch (error) {
      console.error('Pati güncellenirken hata:', error);
      Alert.alert('Hata', 'Pati güncellenirken bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!selectedPati) return;

    Alert.alert(
      'Pati Sil',
      'Bu patiyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const patiRef = doc(db, 'patiler', selectedPati.id);
              await deleteDoc(patiRef);
              Alert.alert('Başarılı', 'Pati başarıyla silindi');
              setModalVisible(false);
              fetchPatiler();
            } catch (error) {
              console.error('Pati silinirken hata:', error);
              Alert.alert('Hata', 'Pati silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

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

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.editButton]}
                      onPress={() => {
                        setModalVisible(false);
                        setEditForm({
                          name: selectedPati.name || '',
                          healthStatus: selectedPati.healthStatus,
                          notes: selectedPati.notes || '',
                          hasFood: selectedPati.hasFood
                        });
                        setEditModalVisible(true);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Düzenle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.deleteButton]}
                      onPress={handleDelete}
                    >
                      <Text style={styles.modalButtonText}>Sil</Text>
                    </TouchableOpacity>
                  </View>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalDetails}>
              <Text style={styles.modalTitle}>Pati Düzenle</Text>

              <Text style={styles.label}>İsim</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Pati ismi"
              />

              <Text style={styles.label}>Sağlık Durumu</Text>
              <View style={styles.statusContainer}>
                {['sağlıklı', 'hasta', 'yaralı'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      editForm.healthStatus === status && styles.statusButtonActive
                    ]}
                    onPress={() => setEditForm({ ...editForm, healthStatus: status })}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      editForm.healthStatus === status && styles.statusButtonTextActive
                    ]}>
                      {getHealthStatusText(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notlar</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.notes}
                onChangeText={(text) => setEditForm({ ...editForm, notes: text })}
                placeholder="Notlar"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setEditForm({ ...editForm, hasFood: !editForm.hasFood })}
              >
                <Ionicons
                  name={editForm.hasFood ? 'checkbox' : 'square-outline'}
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.checkboxLabel}>Etrafında yemek var</Text>
              </TouchableOpacity>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editActionButton, styles.saveButton]}
                  onPress={handleEdit}
                >
                  <Text style={styles.editActionButtonText}>Kaydet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editActionButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.editActionButtonText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  foodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
  },
  notesContainer: {
    marginTop: 8,
    marginBottom: 8,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
  },
  statusButtonText: {
    color: '#333',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  editActionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  editActionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 