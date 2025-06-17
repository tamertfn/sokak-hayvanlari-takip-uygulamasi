import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Animal, CreateAnimalDTO, UpdateAnimalDTO } from '../types/animal';

const COLLECTION_NAME = 'animals';

export const animalService = {
  // Create a new animal
  async create(data: CreateAnimalDTO, userId: string): Promise<Animal> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        lastUpdatedBy: userId
      });

      const doc = await getDoc(docRef);
      return { id: doc.id, ...doc.data() } as Animal;
    } catch (error) {
      console.error('Error creating animal:', error);
      throw error;
    }
  },

  // Get all animals
  async getAll(): Promise<Animal[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Animal[];
    } catch (error) {
      console.error('Error getting animals:', error);
      throw error;
    }
  },

  // Get animal by ID
  async getById(id: string): Promise<Animal | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return { id: docSnap.id, ...docSnap.data() } as Animal;
    } catch (error) {
      console.error('Error getting animal:', error);
      throw error;
    }
  },

  // Update animal
  async update(id: string, data: UpdateAnimalDTO, userId: string): Promise<Animal> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
        lastUpdatedBy: userId
      });

      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Animal;
    } catch (error) {
      console.error('Error updating animal:', error);
      throw error;
    }
  },

  // Delete animal
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting animal:', error);
      throw error;
    }
  },

  // Get animals by user ID
  async getByUserId(userId: string): Promise<Animal[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Animal[];
    } catch (error) {
      console.error('Error getting user animals:', error);
      throw error;
    }
  }
}; 