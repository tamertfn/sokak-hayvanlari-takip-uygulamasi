import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { router } from 'expo-router';
import { Button, Text } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve şifre alanları boş bırakılamaz');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/' as any);
    } catch (error: any) {
      let message = 'Giriş yapılırken bir hata oluştu';
      if (error.code === 'auth/invalid-email') {
        message = 'Geçersiz email adresi';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Hatalı şifre';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Kullanıcı bulunamadı';
      }
      Alert.alert('Hata', message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = () => {
    router.replace('/(tabs)/' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Giriş Yap</Text>
      
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
      
      <Button
        title={loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        onPress={handleLogin}
        disabled={loading}
      />
      
      <Button
        title="Kayıt Ol"
        onPress={() => router.push('/register' as any)}
      />

      <View style={styles.testButtonContainer}>
        <Button
          title="Test Girişi (Haritaya Git)"
          onPress={handleTestLogin}
          color="#FF6B6B"
        />
      </View>
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
  },
  testButtonContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
  }
});
