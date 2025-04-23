import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { router } from 'expo-router';
import { Button, Text } from 'react-native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurunuz');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/' as any);
    } catch (error: any) {
      let message = 'Kayıt olurken bir hata oluştu';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Bu email adresi zaten kullanımda';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Geçersiz email adresi';
      } else if (error.code === 'auth/weak-password') {
        message = 'Şifre çok zayıf';
      }
      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kayıt Ol</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Şifre Tekrar"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <Button
        title={loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
        onPress={handleRegister}
        disabled={loading}
      />
      
      <Button
        title="Giriş Yap"
        onPress={() => router.push('/login' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  }
}); 