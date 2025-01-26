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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Group {
  id: string;
  name: string;
  description: string;
  image?: string;
  createdAt: Date;
  ownerId: string;
  members: string[];
  tags: string[];
  isPrivate: boolean;
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
    const group = await getGroupById(groupId);
    if (!group) throw new Error('Grup bulunamadı');
    if (group.members.includes(userId)) throw new Error('Zaten grupta üyesiniz');

    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayUnion(userId)
    });
  } catch (error: any) {
    throw new Error('Gruba katılınamadı: ' + error.message);
  }
};

// Gruptan ayrıl
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const group = await getGroupById(groupId);
    if (!group) throw new Error('Grup bulunamadı');
    if (!group.members.includes(userId)) throw new Error('Grupta üye değilsiniz');
    if (group.ownerId === userId) throw new Error('Grup sahibi gruptan ayrılamaz');

    await updateDoc(doc(db, 'groups', groupId), {
      members: arrayRemove(userId)
    });
  } catch (error: any) {
    throw new Error('Gruptan ayrılınamadı: ' + error.message);
  }
};

// Kullanıcının gruplarını getir
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Group, 'id'>
    }));
  } catch (error: any) {
    throw new Error('Gruplar alınamadı: ' + error.message);
  }
};

// Grup ara
export const searchGroups = async (query: string): Promise<Group[]> => {
  try {
    const q = query.toLowerCase();
    const querySnapshot = await getDocs(collection(db, 'groups'));
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Group, 'id'>
      }))
      .filter(group => 
        !group.isPrivate && (
          group.name.toLowerCase().includes(q) ||
          group.description.toLowerCase().includes(q) ||
          group.tags.some(tag => tag.toLowerCase().includes(q))
        )
      );
  } catch (error: any) {
    throw new Error('Grup arama hatası: ' + error.message);
  }
}; 