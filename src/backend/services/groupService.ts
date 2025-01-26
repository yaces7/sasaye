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
  image: string;
  memberCount: number;
  members: string[];
  tags: string[];
  createdAt: Date;
  ownerId: string;
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
export const getGroupById = async (groupId: string | undefined): Promise<Group | null> => {
  if (!groupId) return null;
  
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) return null;
    
    return {
      id: groupDoc.id,
      ...groupDoc.data()
    } as Group;
  } catch (error) {
    console.error('Error getting group:', error);
    return null;
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
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) throw new Error('Grup bulunamadı');
    
    const groupData = groupDoc.data();
    const members = groupData.members || [];
    
    if (members.includes(userId)) {
      throw new Error('Zaten bu grubun üyesisiniz');
    }
    
    await updateDoc(groupRef, {
      members: [...members, userId],
      memberCount: members.length + 1
    });
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

// Gruptan ayrıl
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) throw new Error('Grup bulunamadı');
    
    const groupData = groupDoc.data();
    const members = groupData.members || [];
    
    if (!members.includes(userId)) {
      throw new Error('Bu grubun üyesi değilsiniz');
    }
    
    await updateDoc(groupRef, {
      members: members.filter((id: string) => id !== userId),
      memberCount: members.length - 1
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
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
    const groupsRef = collection(db, 'groups');
    const q = query.toLowerCase();
    const querySnapshot = await getDocs(groupsRef);
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Group))
      .filter(group => 
        group.name.toLowerCase().includes(q) ||
        group.description.toLowerCase().includes(q) ||
        group.tags.some(tag => tag.toLowerCase().includes(q))
      );
  } catch (error) {
    console.error('Error searching groups:', error);
    return [];
  }
};

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const querySnapshot = await getDocs(groupsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Group));
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
}; 