import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../utils/imageUpload';

export default function TestScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert('Görsel seçmek için izin gerekli!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        setError('');
      }
    } catch (err) {
      setError('Görsel seçilirken hata oluştu: ' + (err as Error).message);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError('Lütfen önce bir görsel seçin');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const url = await uploadImage(image);
      setUploadedUrl(url);
      alert('Görsel başarıyla yüklendi!');
    } catch (err) {
      setError('Yükleme sırasında hata: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Görsel Seç" onPress={pickImage} />
      
      {image && (
        <Image source={{ uri: image }} style={styles.image} />
      )}
      
      {image && (
        <Button 
          title={loading ? "Yükleniyor..." : "Cloudinary'ye Yükle"} 
          onPress={handleUpload}
          disabled={loading}
        />
      )}

      {uploadedUrl ? (
        <Text style={styles.successText}>
          Yüklenen görsel URL: {uploadedUrl}
        </Text>
      ) : null}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
  },
  successText: {
    marginTop: 10,
    color: 'green',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    textAlign: 'center',
  },
});