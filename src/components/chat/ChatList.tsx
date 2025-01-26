import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Divider, Box } from '@mui/material';

const ChatList = () => {
  const chats = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      lastMessage: 'Merhaba, nasılsın?',
      time: '10:30',
      avatar: 'https://source.unsplash.com/random/40x40?face-1',
    },
    {
      id: 2,
      name: 'Ayşe Demir',
      lastMessage: 'Projeyi tamamladın mı?',
      time: '09:15',
      avatar: 'https://source.unsplash.com/random/40x40?face-2',
    },
    {
      id: 3,
      name: 'Mehmet Kaya',
      lastMessage: 'Toplantı saat kaçta?',
      time: 'Dün',
      avatar: 'https://source.unsplash.com/random/40x40?face-3',
    },
  ];

  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Mesajlar</Typography>
      </Box>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {chats.map((chat, index) => (
          <Box key={chat.id}>
            <ListItem
              alignItems="flex-start"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(0, 184, 169, 0.08)',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar alt={chat.name} src={chat.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={chat.name}
                secondary={
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'inline', mr: 1 }}
                    >
                      {chat.lastMessage}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {chat.time}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < chats.length - 1 && <Divider variant="inset" component="li" />}
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default ChatList; 