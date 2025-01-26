import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Group {
  id: string;
  name: string;
  description: string;
  image?: string;
  ownerId: string;
  members: string[];
  tags: string[];
  createdAt: any;
}

export interface GroupCreateData {
  name: string;
  description: string;
  image?: string;
  tags: string[];
  isPrivate: boolean;
}

// Grup oluştur
export const createGroup = async (userId: string, data: GroupCreateData): Promise<Group> => {
  try {
    const groupData = {
      ...data,
      createdAt: new Date(),
      ownerId: userId,
      members: [userId]
    };

    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return {
      id: docRef.id,
      ...groupData
    };
  } catch (error: any) {
    throw new Error('Grup oluşturma hatası: ' + error.message);
  }
};

// Grup detaylarını getir
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) return null;

    return {
      id: groupDoc.id,
      ...groupDoc.data() as Omit<Group, 'id'>
    };
  } catch (error: any) {
    throw new Error('Grup detayları alınamadı: ' + error.message);
  }
};

// Grup güncelle
export const updateGroup = async (
  groupId: string,
  userId: string,
  data: Partial<GroupCreateData>
): Promise<void> => {
  try {
    const group = await getGroupById(groupId);
    if (!group) throw new Error('Grup bulunamadı');
    if (group.ownerId !== userId) throw new Error('Bu işlem için yetkiniz yok');

    await updateDoc(doc(db, 'groups', groupId), data);
  } catch (error: any) {
    throw new Error('Grup güncellenemedi: ' + error.message);
  }
};

// Grup sil
export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const group = await getGroupById(groupId);
    if (!group) throw new Error('Grup bulunamadı');
    if (group.ownerId !== userId) throw new Error('Bu işlem için yetkiniz yok');

    await deleteDoc(doc(db, 'groups', groupId));
  } catch (error: any) {
    throw new Error('Grup silinemedi: ' + error.message);
  }
};

// Gruba katıl
export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId)
    });
  } catch (error) {
    console.error('Gruba katılma hatası:', error);
    throw error;
  }
};

// Gruptan ayrıl
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId)
    });
  } catch (error) {
    console.error('Gruptan ayrılma hatası:', error);
    throw error;
  }
};

// Kullanıcının gruplarını getir
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(
      groupsRef,
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];
  } catch (error) {
    console.error('Kullanıcı grupları getirme hatası:', error);
    return [];
  }
};

// Grupları ara
export const searchGroups = async (searchQuery: string): Promise<Group[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(
      groupsRef,
      where('name', '>=', searchQuery),
      where('name', '<=', searchQuery + '\uf8ff'),
      orderBy('name'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];
  } catch (error) {
    console.error('Grup arama hatası:', error);
    return [];
  }
}; 