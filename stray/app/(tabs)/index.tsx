import React from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity, Image, Modal, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../src/config/firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../src/config/firebase';

type LocationType = {
  coords: {
    latitude: number;
    longitude: number;
  };
} | null;

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

type Comment = {
  id: string;
  patiId: string;
  userId: string;
  text: string;
  createdAt: any;
};

export default function TabIndexScreen() {
  const [location, setLocation] = useState<LocationType>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [patiler, setPatiler] = useState<Pati[]>([]);
  const [selectedPati, setSelectedPati] = useState<Pati | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userOtherPatiler, setUserOtherPatiler] = useState<Pati[]>([]);
  const [isLoadingUserPatiler, setIsLoadingUserPatiler] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Konum izni reddedildi');
          Alert.alert('Hata', 'Haritayı kullanabilmek için konum izni gereklidir.');
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
        });
        
        console.log('Konum alındı:', location);
        setLocation(location);
      } catch (error) {
        console.error('Konum alınamadı:', error);
        setErrorMsg('Konum alınamadı');
      }
    })();

    fetchPatiler();
  }, []);

  const fetchPatiler = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'patiler'));
      const patiList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pati[];
      setPatiler(patiList);
    } catch (error) {
      console.error('Patiler yüklenirken hata:', error);
      Alert.alert('Hata', 'Patiler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserOtherPatiler = async (userId: string) => {
    try {
      setIsLoadingUserPatiler(true);
      const querySnapshot = await getDocs(
        query(
          collection(db, 'patiler'),
          where('userId', '==', userId)
        )
      );
      const patiList = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(pati => pati.id !== selectedPati?.id) as Pati[];
      setUserOtherPatiler(patiList);
    } catch (error) {
      console.error('Kullanıcının diğer patileri yüklenirken hata:', error);
    } finally {
      setIsLoadingUserPatiler(false);
    }
  };

  const handlePatiSelect = async (pati: Pati) => {
    setSelectedPati(pati);
    setModalVisible(true);
    setUserOtherPatiler([]);
    
    // Favori durumunu kontrol et
    if (auth.currentUser) {
      const favoriteRef = doc(db, 'favorites', `${auth.currentUser.uid}_${pati.id}`);
      const favoriteDoc = await getDoc(favoriteRef);
      setIsFavorite(favoriteDoc.exists());
    }

    // Yorumları dinlemeye başla
    const commentsQuery = query(
      collection(db, 'comments'),
      where('patiId', '==', pati.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsList);
    });

    return () => unsubscribe();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPati || !auth.currentUser) return;

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'comments'), {
        patiId: selectedPati.id,
        userId: auth.currentUser.uid,
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (error) {
      console.error('Yorum eklenirken hata:', error);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedPati || !auth.currentUser) return;

    try {
      const favoriteRef = doc(db, 'favorites', `${auth.currentUser.uid}_${selectedPati.id}`);
      
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
      } else {
        await setDoc(favoriteRef, {
          userId: auth.currentUser.uid,
          patiId: selectedPati.id,
          createdAt: serverTimestamp()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Favori işlemi sırasında hata:', error);
      Alert.alert('Hata', 'Favori işlemi sırasında bir hata oluştu.');
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

  const renderPatiMarker = (pati: Pati) => (
    <Marker
      key={pati.id}
      coordinate={{
        latitude: pati.location.latitude,
        longitude: pati.location.longitude,
      }}
      onPress={() => handlePatiSelect(pati)}
    >
      <View style={styles.markerWrapper}>
        <View style={styles.markerContainer}>
          <Image
            source={{ uri: pati.imageUrl }}
            style={styles.markerImage}
          />
        </View>
        <View style={[styles.markerBadge, { backgroundColor: getHealthStatusColor(pati.healthStatus) }]}>
          <Ionicons
            name={getHealthStatusIcon(pati.healthStatus)}
            size={12}
            color="white"
          />
        </View>
      </View>
    </Marker>
  );

  const toggleFilter = (status: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const getFilteredPatiler = () => {
    if (selectedFilters.length === 0) return patiler;
    return patiler.filter(pati => selectedFilters.includes(pati.healthStatus.toLowerCase()));
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.filterModalContainer}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Sağlık Durumu Filtrele</Text>
            <TouchableOpacity
              style={styles.closeFilterButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterOptions}>
            {['sağlıklı', 'hasta', 'yaralı'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  selectedFilters.includes(status) && styles.filterOptionSelected
                ]}
                onPress={() => toggleFilter(status)}
              >
                <Ionicons
                  name={getHealthStatusIcon(status)}
                  size={24}
                  color={selectedFilters.includes(status) ? 'white' : getHealthStatusColor(status)}
                />
                <Text style={[
                  styles.filterOptionText,
                  selectedFilters.includes(status) && styles.filterOptionTextSelected
                ]}>
                  {getHealthStatusText(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => setSelectedFilters([])}
          >
            <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : undefined}
        showsUserLocation
      >
        {getFilteredPatiler().map(pati => renderPatiMarker(pati))}
      </MapView>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="filter" size={24} color="white" />
        {selectedFilters.length > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{selectedFilters.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchPatiler}
      >
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/yeni-pati')}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Yeni Pati Ekle</Text>
      </TouchableOpacity>

      {renderFilterModal()}

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
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalName}>
                      {selectedPati.name || 'İsimsiz Pati'}
                    </Text>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={toggleFavorite}
                    >
                      <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorite ? '#FF6B6B' : '#666'}
                      />
                    </TouchableOpacity>
                  </View>
                  
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

                  <View style={styles.commentsContainer}>
                    <Text style={styles.commentsTitle}>Yorumlar</Text>
                    {comments.map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <Text style={styles.commentUserId}>{comment.userId}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Yorum yaz..."
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.commentButton, (!newComment.trim() || isSubmitting) && styles.commentButtonDisabled]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="send" size={24} color="white" />
                    )}
                  </TouchableOpacity>
                </View>

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  },
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: '#FF6B6B',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  markerBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
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
    padding: 15,
    maxHeight: '90%',
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  modalDetails: {
    marginTop: 10,
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  foodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4CAF50',
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
  viewOtherPatilerButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  viewOtherPatilerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  userOtherPatilerContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  userOtherPatilerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  userOtherPatiCard: {
    width: 130,
    marginRight: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  userOtherPatiImage: {
    width: '100%',
    height: 90,
    borderRadius: 6,
    marginBottom: 6,
  },
  userOtherPatiName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  userOtherPatiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userOtherPatiStatusText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF6B6B',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  commentsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentUserId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  commentButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#FF6B6B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  filterButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF6B6B',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeFilterButton: {
    padding: 8,
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterOptionSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  filterOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: 'white',
  },
  clearFiltersButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
