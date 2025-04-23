import { CLOUDINARY_CONFIG } from '../config/constants';

export const uploadImage = async (imageUri: string): Promise<string> => {
  try {
    // Env değerlerini kontrol et
    const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary yapılandırma bilgileri eksik');
    }

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: new Date().getTime() + '.jpg'
    } as any);
    
    formData.append('upload_preset', uploadPreset);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
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
    console.log('Upload result:', uploadResult);

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    return uploadResult.secure_url;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    throw error;
  }
};