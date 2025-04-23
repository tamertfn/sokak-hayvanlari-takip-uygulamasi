import { CLOUDINARY_CONFIG } from '../config/constants';

export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: new Date().getTime() + '.jpg'
    } as any);
    
    // Sadece upload_preset kullanıyoruz, API key'e gerek yok
    formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    // Cloud name ile upload URL'ini oluşturuyoruz
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const uploadResult = await uploadResponse.json();
    console.log('Upload result:', uploadResult); // Hata ayıklama için

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    return uploadResult.secure_url;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    throw error;
  }
};