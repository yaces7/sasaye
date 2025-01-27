import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  ownerId: string;
  isDiscoverable: boolean;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Date;
}

// Grup oluştur
export const createGroup = async (groupData: Omit<Group, 'id' | 'memberCount' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const groupRef = doc(collection(db, 'groups'));
    const now = new Date();
    
    const newGroup: Group = {
      id: groupRef.id,
      ...groupData,
      memberCount: 1,
      isDiscoverable: false,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(groupRef, newGroup);

    // Kurucuyu üye olarak ekle
    await setDoc(doc(db, 'groupMembers', `${groupRef.id}_${groupData.ownerId}`), {
      userId: groupData.ownerId,
      groupId: groupRef.id,
      role: 'owner',
      joinedAt: now
    });

    return groupRef.id;
  } catch (error) {
    console.error('Grup oluşturma hatası:', error);
    throw error;
  }
};

// Grup bilgilerini getir
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) return null;
    return groupDoc.data() as Group;
  } catch (error) {
    console.error('Grup bilgileri alınamadı:', error);
    throw error;
  }
};

// Keşfedilebilir grupları getir
export const getDiscoverableGroups = async (limitCount: number = 20): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('isDiscoverable', '==', true),
      where('memberCount', '>=', 10),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Group);
  } catch (error) {
    console.error('Keşfedilebilir gruplar alınamadı:', error);
    throw error;
  }
};

// Gruba üye ekle
export const addGroupMember = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) throw new Error('Grup bulunamadı');

    const memberRef = doc(db, 'groupMembers', `${groupId}_${userId}`);
    const memberDoc = await getDoc(memberRef);
    if (memberDoc.exists()) throw new Error('Kullanıcı zaten grupta');

    await setDoc(memberRef, {
      userId,
      groupId,
      role: 'member',
      joinedAt: new Date()
    });

    await updateDoc(doc(db, 'groups', groupId), {
      memberCount: (groupDoc.data() as Group).memberCount + 1,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Üye ekleme hatası:', error);
    throw error;
  }
};

// Grup üyesini çıkar
export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  try {
    const memberRef = doc(db, 'groupMembers', `${groupId}_${userId}`);
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) throw new Error('Üye bulunamadı');

    const memberData = memberDoc.data() as GroupMember;
    if (memberData.role === 'owner') throw new Error('Grup sahibi gruptan çıkarılamaz');

    await deleteDoc(memberRef);

    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      await updateDoc(doc(db, 'groups', groupId), {
        memberCount: (groupDoc.data() as Group).memberCount - 1,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Üye çıkarma hatası:', error);
    throw error;
  }
};

// Grup ayarlarını güncelle
export const updateGroupSettings = async (groupId: string, settings: Partial<Group>): Promise<void> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) throw new Error('Grup bulunamadı');

    const currentGroup = groupDoc.data() as Group;
    
    if (settings.isDiscoverable && currentGroup.memberCount < 10) {
      throw new Error('Grup keşfedilebilir olması için en az 10 üyeye sahip olmalı');
    }

    await updateDoc(doc(db, 'groups', groupId), {
      ...settings,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Grup ayarları güncelleme hatası:', error);
    throw error;
  }
};

// Grup üyelerini getir
export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  try {
    const q = query(collection(db, 'groupMembers'), where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as GroupMember);
  } catch (error) {
    console.error('Grup üyeleri alınamadı:', error);
    throw error;
  }
};

// Kullanıcının gruplarını getir
export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const memberQuery = query(collection(db, 'groupMembers'), where('userId', '==', userId));
    const memberSnapshot = await getDocs(memberQuery);
    
    const groupIds = memberSnapshot.docs.map(doc => doc.data().groupId);
    const groups: Group[] = [];
    
    for (const groupId of groupIds) {
      const group = await getGroupById(groupId);
      if (group) groups.push(group);
    }
    
    return groups;
  } catch (error) {
    console.error('Kullanıcı grupları alınamadı:', error);
    throw error;
  }
};

// Benzersiz ID kontrolü
const isCustomIdUnique = async (customId: string): Promise<boolean> => {
  const q = query(collection(db, 'groups'), where('customId', '==', customId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

// Benzersiz 9 haneli kullanıcı ID'si oluştur
export const generateCustomId = async (): Promise<string> => {
  const min = 100000000;
  const max = 999999999;
  let customId: string;
  do {
    customId = Math.floor(Math.random() * (max - min + 1) + min).toString();
  } while (!(await isCustomIdUnique(customId)));
  return customId;
}; 