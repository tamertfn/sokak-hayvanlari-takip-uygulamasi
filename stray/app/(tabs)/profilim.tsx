import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, FlatList, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/config/firebase';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, onSnapshot, addDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { router } from 'expo-router';

type UserProfile = {
  displayName: string;
  email: string;
  photoURL: string;
  bio: string | null;
};

type FavoritePati = {
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
  userId: string;
  text: string;
};

export default function ProfilimScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    photoURL: '',
    bio: 'Hayvan sever ve doğa dostu biriyim. Sokak hayvanlarına yardım etmeyi seviyorum.'
  });
  const [favorites, setFavorites] = useState<FavoritePati[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [selectedPati, setSelectedPati] = useState<FavoritePati | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      setEditedProfile({
        displayName: emailName.charAt(0).toUpperCase() + emailName.slice(1),
        email: user.email,
        photoURL: `https://i.pravatar.cc/300?u=${user.email}`,
        bio: 'Hayvan sever ve doğa dostu biriyim. Sokak hayvanlarına yardım etmeyi seviyorum.'
      });
    }
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    if (!auth.currentUser) return;

    try {
      setLoadingFavorites(true);
      // Favorileri getir
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      
      // Favori patilerin detaylarını getir
      const favoritePatiler = await Promise.all(
        favoritesSnapshot.docs.map(async (doc) => {
          const patiId = doc.data().patiId;
          const patiDoc = await getDocs(
            query(collection(db, 'patiler'), where('__name__', '==', patiId))
          );
          if (!patiDoc.empty) {
            return {
              id: patiDoc.docs[0].id,
              ...patiDoc.docs[0].data()
            } as FavoritePati;
          }
          return null;
        })
      );

      setFavorites(favoritePatiler.filter((pati): pati is FavoritePati => pati !== null));
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    } finally {
      setLoadingFavorites(false);
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

  const handlePatiSelect = async (pati: FavoritePati) => {
    setSelectedPati(pati);
    setModalVisible(true);
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

  const renderFavoriteItem = ({ item }: { item: FavoritePati }) => (
    <TouchableOpacity
      style={styles.favoriteItem}
      onPress={() => handlePatiSelect(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.favoriteImage} />
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteName}>{item.name || 'İsimsiz Pati'}</Text>
        <View style={styles.healthStatus}>
          <Ionicons
            name={getHealthStatusIcon(item.healthStatus)}
            size={16}
            color={getHealthStatusColor(item.healthStatus)}
          />
          <Text style={[styles.healthText, { color: getHealthStatusColor(item.healthStatus) }]}>
            {item.healthStatus}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.photoContainer}>
            <Image source={{ uri: editedProfile.photoURL }} style={styles.profilePhoto} />
          </View>
          <Text style={styles.headerName}>{editedProfile.displayName}</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.editButtonText}>Profili Düzenle</Text>
              <Text style={styles.editButtonNote}>(Backend henüz eklenmedi)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          <>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>İsim</Text>
                <TextInput
                  style={styles.input}
                  value={editedProfile.displayName}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, displayName: text }))}
                  placeholder="İsminiz"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hakkımda</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editedProfile.bio || ''}
                  onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
                  placeholder="Kendinizden bahsedin"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Ionicons name="checkmark" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <Ionicons name="close" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Favorilerim</Text>
              {loadingFavorites ? (
                <ActivityIndicator color="#FF6B6B" style={styles.loadingIndicator} />
              ) : favorites.length === 0 ? (
                <Text style={styles.emptyText}>Henüz favori patiniz yok</Text>
              ) : (
                <FlatList
                  data={favorites}
                  renderItem={renderFavoriteItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.infoGroup}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.infoIcon} />
                  <View style={styles.infoContent}>
                    <Text style={styles.label}>E-posta</Text>
                    <Text style={styles.infoText}>{editedProfile.email}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoGroup}>
                <View style={styles.infoRow}>
                  <Ionicons name="information-circle-outline" size={20} color="#666" style={styles.infoIcon} />
                  <View style={styles.infoContent}>
                    <Text style={styles.label}>Hakkımda</Text>
                    <Text style={styles.infoText}>{editedProfile.bio}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </View>

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
                      {selectedPati.healthStatus}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.84,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  infoGroup: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 4,
  },
  editButtonNote: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  favoriteImage: {
    width: 80,
    height: 80,
  },
  favoriteInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingIndicator: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalDetails: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  favoriteButton: {
    padding: 8,
  },
  foodStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  foodText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
  },
  notesContainer: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  commentsContainer: {
    marginTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentUserId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
  closeButton: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 