import React from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity, Image, Modal, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
};

export default function TabIndexScreen() {
  const [location, setLocation] = useState<LocationType>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [patiler, setPatiler] = useState<Pati[]>([]);
  const [selectedPati, setSelectedPati] = useState<Pati | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      onPress={() => {
        setSelectedPati(pati);
        setModalVisible(true);
      }}
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
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  healthText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
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
});
