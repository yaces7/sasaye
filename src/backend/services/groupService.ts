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
  limit,
  addDoc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notificationService';
import { getUserByCustomId } from './userService';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  image?: string;
  ownerId: string;
  members?: string[];
  tags?: string[];
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

const MAX_GROUPS_PER_USER = 3;

// Grup oluştur
export const createGroup = async (
  userId: string,
  groupData: Omit<Group, 'id' | 'memberCount' | 'createdAt' | 'ownerId'>
): Promise<string> => {
  try {
    // Kullanıcının mevcut grup sayısını kontrol et
    const userGroupsQuery = query(
      collection(db, 'groups'),
      where('ownerId', '==', userId)
    );
    const userGroups = await getDocs(userGroupsQuery);

    if (userGroups.size >= MAX_GROUPS_PER_USER) {
      throw new Error('En fazla 3 grup oluşturabilirsiniz.');
    }

    const groupRef = doc(collection(db, 'groups'));
    const newGroup: Group = {
      id: groupRef.id,
      ...groupData,
      ownerId: userId,
      memberCount: 1, // Oluşturan kişi otomatik üye olur
      createdAt: new Date(),
      members: [userId]
    };

    await setDoc(groupRef, newGroup);

    // Kullanıcıyı grubun üyesi olarak ekle
    const groupMembersRef = doc(db, 'groupMembers', groupRef.id);
    await setDoc(groupMembersRef, {
      members: [userId],
      joinedAt: { [userId]: new Date() }
    });

    return groupRef.id;
  } catch (error: any) {
    console.error('Grup oluşturma hatası:', error);
    throw error;
  }
};

// Grup bilgilerini getir
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      return null;
    }
    return { ...groupDoc.data(), id: groupDoc.id } as Group;
  } catch (error) {
    console.error('Grup detayları alma hatası:', error);
    throw error;
  }
};

// Keşfedilebilir grupları getir
export const getDiscoverableGroups = async (limitCount: number = 10): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, 'groups'),
      where('isDiscoverable', '==', true),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Group);
  } catch (error) {
    console.error('Keşfedilebilir grupları alma hatası:', error);
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
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Group);
  } catch (error) {
    console.error('Kullanıcı gruplarını alma hatası:', error);
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

// Gruba katıl
export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) throw new Error('Grup bulunamadı');

    const memberRef = doc(db, 'groupMembers', `${groupId}_${userId}`);
    const memberDoc = await getDoc(memberRef);
    if (memberDoc.exists()) throw new Error('Zaten gruptasınız');

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
    console.error('Gruba katılma hatası:', error);
    throw error;
  }
};

// Gruptan ayrıl
export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const memberRef = doc(db, 'groupMembers', `${groupId}_${userId}`);
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) throw new Error('Grupta üye değilsiniz');

    const memberData = memberDoc.data() as GroupMember;
    if (memberData.role === 'owner') throw new Error('Grup sahibi gruptan ayrılamaz');

    await deleteDoc(memberRef);

    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      await updateDoc(doc(db, 'groups', groupId), {
        memberCount: (groupDoc.data() as Group).memberCount - 1,
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Gruptan ayrılma hatası:', error);
    throw error;
  }
};

// Grupları ara
export const searchGroups = async (searchQuery: string): Promise<Group[]> => {
  try {
    const lowerQuery = searchQuery.toLowerCase();
    const q = query(
      collection(db, 'groups'),
      where('name', '>=', lowerQuery),
      where('name', '<=', lowerQuery + '\uf8ff'),
      where('isDiscoverable', '==', true),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Group);
  } catch (error) {
    console.error('Grup arama hatası:', error);
    throw error;
  }
};

// Gruba davet et
export const inviteToGroup = async (groupId: string, invitedUserId: string, inviterUserId: string): Promise<void> => {
  try {
    const group = await getGroupById(groupId);
    if (!group) throw new Error('Grup bulunamadı');

    // Davet eden kişinin grup üyesi olup olmadığını kontrol et
    const inviterMemberRef = doc(db, 'groupMembers', `${groupId}_${inviterUserId}`);
    const inviterMemberDoc = await getDoc(inviterMemberRef);
    if (!inviterMemberDoc.exists()) throw new Error('Davet etme yetkiniz yok');

    // Davet edilen kişinin zaten grupta olup olmadığını kontrol et
    const invitedMemberRef = doc(db, 'groupMembers', `${groupId}_${invitedUserId}`);
    const invitedMemberDoc = await getDoc(invitedMemberRef);
    if (invitedMemberDoc.exists()) throw new Error('Kullanıcı zaten grupta');

    // Davet bilgisini kaydet
    await addDoc(collection(db, 'groupInvites'), {
      groupId,
      invitedUserId,
      inviterUserId,
      status: 'pending',
      createdAt: new Date()
    });

    // Bildirim oluştur
    await createNotification({
      userId: invitedUserId,
      type: 'group_invite',
      title: 'Grup Daveti',
      message: `${group.name} grubuna davet edildiniz`,
      link: `/groups/${groupId}`,
      data: {
        groupId,
        senderId: inviterUserId
      }
    });

  } catch (error) {
    console.error('Gruba davet hatası:', error);
    throw error;
  }
};

// Daveti kabul et
export const acceptGroupInvite = async (groupId: string, userId: string): Promise<void> => {
  try {
    const inviteQuery = query(
      collection(db, 'groupInvites'),
      where('groupId', '==', groupId),
      where('invitedUserId', '==', userId),
      where('status', '==', 'pending')
    );

    const inviteSnapshot = await getDocs(inviteQuery);
    if (inviteSnapshot.empty) throw new Error('Davet bulunamadı');

    const inviteDoc = inviteSnapshot.docs[0];
    const invite = inviteDoc.data();

    // Daveti kabul edildi olarak işaretle
    await updateDoc(doc(db, 'groupInvites', inviteDoc.id), {
      status: 'accepted'
    });

    // Kullanıcıyı gruba ekle
    await addGroupMember(groupId, userId);

    // Davet eden kişiye bildirim gönder
    await createNotification({
      userId: invite.inviterUserId,
      type: 'group_join',
      title: 'Davet Kabul Edildi',
      message: `Davet ettiğiniz kişi gruba katıldı`,
      link: `/groups/${groupId}`,
      data: {
        groupId,
        senderId: userId
      }
    });

  } catch (error) {
    console.error('Davet kabul hatası:', error);
    throw error;
  }
};

// ID ile kullanıcı davet et
export const inviteUserByCustomId = async (groupId: string, customId: string, inviterUserId: string): Promise<void> => {
  try {
    const user = await getUserByCustomId(customId);
    if (!user) throw new Error('Kullanıcı bulunamadı');
    
    await inviteToGroup(groupId, user.id, inviterUserId);
  } catch (error) {
    console.error('Kullanıcı daveti hatası:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) {
      throw new Error('Grup bulunamadı.');
    }

    const groupData = groupDoc.data() as Group;
    if (groupData.ownerId !== userId) {
      throw new Error('Bu grubu silme yetkiniz yok.');
    }

    // Grup ve ilgili verileri sil
    await deleteDoc(doc(db, 'groups', groupId));
    await deleteDoc(doc(db, 'groupMembers', groupId));
  } catch (error) {
    console.error('Grup silme hatası:', error);
    throw error;
  }
}; 