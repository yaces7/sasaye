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
  Alert
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import GroupCard from '../components/GroupCard';
import VideoCard from '../components/VideoCard';
import { searchGroups, Group } from '../backend/services/groupService';
import { searchVideos, Video } from '../backend/services/videoService';

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

const Explore = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Arama sonuçları
  const [groups, setGroups] = useState<Group[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  // Tab değişikliği
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Arama işlemi
  useEffect(() => {
    const searchContent = async () => {
      if (!searchQuery.trim()) {
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
  }, [searchQuery, tabValue]);

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
          onChange={(e) => setSearchQuery(e.target.value)}
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
        {!loading && groups.length === 0 && searchQuery && (
          <Typography color="text.secondary" align="center">
            Grup bulunamadı
          </Typography>
        )}
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <GroupCard group={group} />
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
    </Container>
  );
};

export default Explore; 