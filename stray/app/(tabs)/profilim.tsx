import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../src/config/firebase';

type UserProfile = {
  displayName: string;
  email: string;
  photoURL: string;
  bio: string | null;
};

export default function ProfilimScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    photoURL: '',
    bio: 'Hayvan sever ve doğa dostu biriyim. Sokak hayvanlarına yardım etmeyi seviyorum.'
  });

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
  }, []);

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
        )}
    </View>
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
}); 