import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

type HealthStatus = 'sağlıklı' | 'hasta' | 'yaralı' | 'bilinmiyor';

export default function YeniPatiScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('bilinmiyor');
  const [hasFood, setHasFood] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Hata', 'Fotoğraf çekmek için kamera izni gereklidir.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Hata', 'Lütfen bir fotoğraf çekin');
      return;
    }

    setLoading(true);
    try {
      // TODO: Firebase'e kaydetme işlemi burada yapılacak
      Alert.alert('Başarılı', 'Pati başarıyla kaydedildi!');
      router.back();
    } catch (error) {
      Alert.alert('Hata', 'Pati kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6B6B" />
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Pati Ekle</Text>
      </View>

      <TouchableOpacity style={styles.photoContainer} onPress={takePhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={40} color="#FF6B6B" />
            <Text style={styles.photoText}>Fotoğraf Çek</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>İsim (İsteğe Bağlı)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Patinin ismi"
        />

        <Text style={styles.label}>Sağlık Durumu</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={healthStatus}
            onValueChange={(value) => setHealthStatus(value as HealthStatus)}
            style={styles.picker}
          >
            <Picker.Item label="Sağlıklı" value="sağlıklı" />
            <Picker.Item label="Hasta" value="hasta" />
            <Picker.Item label="Yaralı" value="yaralı" />
            <Picker.Item label="Bilinmiyor" value="bilinmiyor" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.checkbox, hasFood && styles.checkboxSelected]}
          onPress={() => setHasFood(!hasFood)}
        >
          <Ionicons
            name={hasFood ? 'checkbox' : 'square-outline'}
            size={24}
            color="#FF6B6B"
          />
          <Text style={styles.checkboxText}>Etrafında yemek var mı?</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Notlar</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Eklemek istediğiniz notlar..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  photoText: {
    marginTop: 8,
    color: '#FF6B6B',
    fontSize: 16,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxSelected: {
    backgroundColor: '#fff5f5',
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 