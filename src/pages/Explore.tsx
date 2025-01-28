import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import GroupCard from '../components/groups/GroupCard';
import VideoCard from '../components/video/VideoCard';
import { searchGroups, Group, getUserGroups } from '../backend/services/groupService';
import { searchVideos, Video, getAllVideos } from '../backend/services/videoService';
import { db } from '../backend/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  doc,
} from 'firebase/firestore';
import { uploadImage } from '../backend/services/uploadService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`explore-tabpanel-${index}`}
      aria-labelledby={`explore-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  likes: string[];
  comments: number;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const Explore = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Arama sonuçları
  const [groups, setGroups] = useState<Group[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [open, setOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    imageFile: null as File | null,
    tags: '',
  });
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tab değişikliği
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Arama işlemi
  useEffect(() => {
    const searchContent = async () => {
      if (!searchQuery.trim() || !currentUser) {
        setGroups([]);
        setVideos([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (tabValue === 0) { // Gruplar
          const results = await searchGroups(searchQuery);
          setGroups(results);
          setFilteredGroups(results);
        } else { // Videolar
          const results = await searchVideos(searchQuery);
          setVideos(results);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchContent, 500);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, tabValue, currentUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) {
        setGroups([]);
        setVideos([]);
        return;
      }

      try {
        if (tabValue === 0) {
          const fetchedGroups = await getUserGroups(currentUser.id);
          setGroups(fetchedGroups);
          setFilteredGroups(fetchedGroups);
        } else {
          const fetchedVideos = await getAllVideos();
          setVideos(fetchedVideos);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [tabValue, currentUser]);

  useEffect(() => {
    if (!groups.length) return;
    
    const filtered = groups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
    setFilteredGroups(filtered);
  }, [searchQuery, groups]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // Gönderileri getir
  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      // Kullanıcının ilgi alanlarına göre sırala
      if (currentUser?.interests && currentUser.interests.length > 0) {
        fetchedPosts.sort((a, b) => {
          const aMatchCount = a.tags.filter(tag => currentUser.interests!.includes(tag)).length;
          const bMatchCount = b.tags.filter(tag => currentUser.interests!.includes(tag)).length;
          return bMatchCount - aMatchCount;
        });
      }

      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Gönderiler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentUser]);

  // Yeni gönderi oluştur
  const handleCreatePost = async () => {
    if (!currentUser) {
      setUploadError('Oturum açmanız gerekiyor');
      return;
    }

    try {
      setUploadProgress(true);
      setUploadError(null);

      let imageUrl = '';
      if (newPost.imageFile) {
        const uploadResult = await uploadImage(newPost.imageFile);
        imageUrl = uploadResult.url;
      }

      const tags = newPost.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
      
      const postData = {
        userId: currentUser.uid,
        username: currentUser.username || '',
        userAvatar: currentUser.avatar || '',
        content: newPost.content,
        imageUrl,
        tags,
        likes: [] as string[],
        comments: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'posts'), postData);

      setOpen(false);
      setNewPost({ content: '', imageFile: null, tags: '' });
      fetchPosts();
    } catch (error: any) {
      setUploadError(error.message);
      console.error('Gönderi oluşturulurken hata:', error);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewPost({ ...newPost, imageFile: file });
    }
  };

  // Gönderiyi beğen
  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(currentUser.uid)
      });
      fetchPosts();
    } catch (error) {
      console.error('Beğeni eklenirken hata:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Arama Alanı */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Keşfet
        </Typography>
        <TextField
          fullWidth
          placeholder="Ara..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tab Menüsü */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Gruplar" />
          <Tab label="Videolar" />
        </Tabs>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Yükleniyor */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Gruplar Tab Paneli */}
      <TabPanel value={tabValue} index={0}>
        {!loading && filteredGroups.length === 0 && searchQuery && (
          <Typography color="text.secondary" align="center">
            Grup bulunamadı
          </Typography>
        )}
        <Grid container spacing={3}>
          {filteredGroups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <GroupCard 
                group={{
                  id: group.id,
                  name: group.name,
                  description: group.description,
                  memberCount: group.members?.length || 0,
                  image: group.image || '/default-group-image.png',
                  isJoined: group.members?.includes(currentUser?.id || '') || false,
                  isOwner: group.ownerId === currentUser?.id || false,
                  tags: group.tags || []
                }} 
              />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Videolar Tab Paneli */}
      <TabPanel value={tabValue} index={1}>
        {!loading && videos.length === 0 && searchQuery && (
          <Typography color="text.secondary" align="center">
            Video bulunamadı
          </Typography>
        )}
        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} key={video.id}>
              <VideoCard video={video} />
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Gönderi Oluşturma Butonu */}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 3 }}
      >
        Yeni Gönderi Oluştur
      </Button>

      {/* Gönderi Listesi */}
      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} sm={6} md={4} key={post.id}>
            <Card>
              {post.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={post.imageUrl}
                  alt="Post image"
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={post.userAvatar} sx={{ mr: 1 }}>
                    {post.username[0]}
                  </Avatar>
                  <Typography variant="subtitle1">{post.username}</Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {post.content}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {post.tags.map((tag) => (
                    <Chip key={tag} label={`#${tag}`} size="small" />
                  ))}
                </Stack>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <IconButton onClick={() => handleLike(post.id)} color={post.likes.includes(currentUser?.uid || '') ? 'primary' : 'default'}>
                    <FavoriteIcon />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {post.likes.length}
                    </Typography>
                  </IconButton>
                  <IconButton>
                    <CommentIcon />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      {post.comments}
                    </Typography>
                  </IconButton>
                  <IconButton>
                    <ShareIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gönderi Oluşturma Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Gönderi Oluştur</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Ne düşünüyorsun?"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            sx={{ mb: 2, mt: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="post-image-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="post-image-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<AddIcon />}
              >
                Fotoğraf Ekle
              </Button>
            </label>
            {newPost.imageFile && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Seçilen dosya: {newPost.imageFile.name}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="Etiketler (virgülle ayırın)"
            value={newPost.tags}
            onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
            helperText="Örnek: teknoloji, spor, müzik"
          />
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploadProgress}>
            İptal
          </Button>
          <Button 
            onClick={handleCreatePost} 
            variant="contained"
            disabled={uploadProgress}
          >
            {uploadProgress ? <CircularProgress size={24} /> : 'Paylaş'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Explore; 