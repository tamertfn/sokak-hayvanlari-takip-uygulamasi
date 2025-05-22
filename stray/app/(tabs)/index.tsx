import React from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import MapView from 'react-native-maps';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type LocationType = {
  coords: {
    latitude: number;
    longitude: number;
  };
} | null;

export default function TabIndexScreen() {
  const [location, setLocation] = useState<LocationType>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, []);

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
          />
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => router.push('/yeni-pati' as any)}
          >
            <View style={styles.fabContent}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.fabText}>Yeni Pati Ekle</Text>
            </View>
          </TouchableOpacity>
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
});
