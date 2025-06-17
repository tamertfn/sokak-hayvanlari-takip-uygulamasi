import React from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity, Image, Modal, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../src/config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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

export default function TabIndexScreen() {
  const [location, setLocation] = useState<LocationType>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [patiler, setPatiler] = useState<Pati[]>([]);
  const [selectedPati, setSelectedPati] = useState<Pati | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userOtherPatiler, setUserOtherPatiler] = useState<Pati[]>([]);
  const [isLoadingUserPatiler, setIsLoadingUserPatiler] = useState(false);

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

  const handlePatiSelect = (pati: Pati) => {
    setSelectedPati(pati);
    setModalVisible(true);
    setUserOtherPatiler([]);
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

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            provider="google"
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {patiler.map(renderPatiMarker)}
          </MapView>

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchPatiler}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="refresh" size={24} color="white" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push('/yeni-pati' as any)}
          >
            <View style={styles.fabContent}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.fabText}>Yeni Pati Ekle</Text>
            </View>
          </TouchableOpacity>

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

                      {selectedPati.userId && (
                        <TouchableOpacity
                          style={styles.viewOtherPatilerButton}
                          onPress={() => {
                            if (selectedPati.userId) {
                              fetchUserOtherPatiler(selectedPati.userId);
                            }
                          }}
                          disabled={isLoadingUserPatiler}
                        >
                          {isLoadingUserPatiler ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <>
                              <Ionicons name="paw" size={20} color="white" />
                              <Text style={styles.viewOtherPatilerButtonText}>
                                Kullanıcının Diğer Patilerini Gör
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {userOtherPatiler.length > 0 && (
                        <View style={styles.userOtherPatilerContainer}>
                          <Text style={styles.userOtherPatilerTitle}>Kullanıcının Diğer Patileri</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {userOtherPatiler.map((pati) => (
                              <TouchableOpacity
                                key={pati.id}
                                style={styles.userOtherPatiCard}
                                onPress={() => {
                                  setSelectedPati(pati);
                                  setUserOtherPatiler([]);
                                }}
                              >
                                <Image source={{ uri: pati.imageUrl }} style={styles.userOtherPatiImage} />
                                <Text style={styles.userOtherPatiName}>{pati.name || 'İsimsiz Pati'}</Text>
                                <View style={styles.userOtherPatiStatus}>
                                  <Ionicons
                                    name={getHealthStatusIcon(pati.healthStatus)}
                                    size={16}
                                    color={getHealthStatusColor(pati.healthStatus)}
                                  />
                                  <Text style={[styles.userOtherPatiStatusText, { color: getHealthStatusColor(pati.healthStatus) }]}>
                                    {getHealthStatusText(pati.healthStatus)}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
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
        </>
      ) : (
        <View style={styles.container}>
          <Text style={styles.errorText}>Konum yükleniyor...</Text>
        </View>
      )}
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
    right: 20,
    top: 20,
    backgroundColor: '#FF6B6B',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
});
