import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface Group {
  id: string;
  name: string;
  description: string;
  image?: string;
  ownerId: string;
  members: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  memberCount: number;
  isPublic: boolean;
  tags: string[];
}

export interface GroupMember {
  userId: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}

export const createGroup = async (data: { 
  name: string; 
  description: string; 
  image?: string;
  tags?: string[];
}): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Kullanıcı oturum açmamış');
    }

    const groupData: Omit<Group, 'id'> = {
      name: data.name,
      description: data.description,
      image: data.image || '',
      ownerId: user.uid,
      members: [user.uid],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      memberCount: 1,
      isPublic: true,
      tags: data.tags || []
    };

    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return docRef.id;
  } catch (error) {
    console.error('Grup oluşturma hatası:', error);
    throw error;
  }
};

export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Group;
  } catch (error) {
    console.error('Grup getirme hatası:', error);
    throw error;
  }
};

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Group));
  } catch (error) {
    console.error('Grupları getirme hatası:', error);
    throw error;
  }
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Group));
  } catch (error) {
    console.error('Kullanıcı gruplarını getirme hatası:', error);
    throw error;
  }
};

export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('Grup bulunamadı');
    }

    const groupData = groupDoc.data() as Group;
    
    if (groupData.members.includes(userId)) {
      return; // Zaten üye
    }

    await updateDoc(groupRef, {
      members: [...groupData.members, userId],
      memberCount: groupData.memberCount + 1,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Gruba katılma hatası:', error);
    throw error;
  }
};

export const leaveGroup = async (groupId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Kullanıcı oturum açmamış');
    }

    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('Grup bulunamadı');
    }

    const groupData = groupDoc.data() as Group;

    if (groupData.ownerId === user.uid) {
      throw new Error('Grup sahibi gruptan ayrılamaz');
    }

    const updatedMembers = groupData.members.filter(id => id !== user.uid);

    await updateDoc(groupRef, {
      members: updatedMembers,
      memberCount: groupData.memberCount - 1,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Gruptan ayrılma hatası:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      throw new Error('Grup bulunamadı');
    }

    const groupData = groupDoc.data() as Group;

    if (groupData.ownerId !== userId) {
      throw new Error('Bu grubu silme yetkiniz yok');
    }

    await deleteDoc(groupRef);
  } catch (error) {
    console.error('Grup silme hatası:', error);
    throw error;
  }
};

export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      throw new Error('Grup bulunamadı');
    }

    const groupData = groupDoc.data() as Group;
    
    return groupData.members.map(userId => ({
      userId,
      role: userId === groupData.ownerId ? 'owner' : 'member',
      joinedAt: groupData.createdAt // Şimdilik katılma tarihi olarak grup oluşturma tarihini kullanıyoruz
    }));
  } catch (error) {
    console.error('Grup üyelerini getirme hatası:', error);
    throw error;
  }
};

export const inviteUserByCustomId = async (groupId: string, invitedUserId: string, inviterId: string): Promise<void> => {
  try {
    await joinGroup(groupId, invitedUserId);
  } catch (error) {
    console.error('Kullanıcı davet hatası:', error);
    throw error;
  }
};