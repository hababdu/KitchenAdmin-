import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Work as WorkIcon, Person as PersonIcon, Phone as PhoneIcon, Check as CheckIcon } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#3366ff' },
    secondary: { main: '#ff3d71' },
    success: { main: '#00d68f' },
    background: { default: '#f7f9fc' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.75rem' },
  },
});

const KitchenProfile = () => {
  const [profile, setProfile] = useState(null);
  const [kitchen, setKitchen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isToggling, setIsToggling] = useState(false);
  const token = localStorage.getItem('authToken');
  const PROFILE_URL = 'https://hosilbek.pythonanywhere.com/api/user/me/';
  const KITCHENS_URL = 'https://hosilbek.pythonanywhere.com/api/user/kitchens/';

  const axiosInstance = axios.create({
    headers: { Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
  });

  // Profil va oshxona ma'lumotlarini olish
  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Foydalanuvchi tizimga kirmagan');
      setLoading(false);
      window.location.href = '/login';
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Profil ma'lumotlarini olish
      const profileResponse = await axiosInstance.get(PROFILE_URL);
      const userProfile = profileResponse.data;
      if (!userProfile.roles?.is_kitchen_admin) {
        setError('Siz oshxona admini emassiz. Tizimga kirish uchun login sahifasiga qayting.');
        localStorage.clear();
        window.location.href = '/login';
        return;
      }
      setProfile(userProfile);
      console.log('Profil ma’lumotlari yuklandi:', userProfile);

      // kitchen_id ni profil ma'lumotlaridan olish
      const kitchenId = userProfile.kitchen_admin_profile?.kitchen_id;
      if (!kitchenId) {
        setError('Oshxona ID si topilmadi. Administrator bilan bog‘laning.');
        setLoading(false);
        return;
      }
      console.log('Kitchen ID:', kitchenId);

      // Oshxona ma'lumotlarini olish
      const kitchenResponse = await axiosInstance.get(`${KITCHENS_URL}${kitchenId}/`);
      setKitchen(kitchenResponse.data);
      console.log('Oshxona ma’lumotlari yuklandi:', kitchenResponse.data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      let errorMessage = 'Ma’lumotlarni yuklashda xatolik';
      if (err.response?.status === 401) {
        errorMessage = 'Autentifikatsiya xatosi: Iltimos, qayta tizimga kiring.';
        localStorage.clear();
        window.location.href = '/login';
      } else if (err.response?.status === 404) {
        errorMessage = 'Oshxona topilmadi. Administrator bilan bog‘laning.';
      } else {
        errorMessage = err.response?.data?.detail || err.response?.data?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // is_aktiv holatini o‘zgartirish
  const handleToggleWorkStatus = useCallback(async () => {
    if (!token || !kitchen?.id) {
      setSnackbar({
        open: true,
        message: !token ? 'Foydalanuvchi tizimga kirmagan.' : 'Oshxona ID si topilmadi.',
        severity: 'error',
      });
      if (!token) window.location.href = '/login';
      return;
    }
    const newStatus = !kitchen.is_aktiv;
    try {
      setIsToggling(true);
      const url = `${KITCHENS_URL}${kitchen.id}/`;
      const payload = { is_aktiv: newStatus };
      console.log('PATCH URL:', url);
      console.log('Payload:', payload);
      console.log('Token:', token);
      await axiosInstance.patch(url, payload);
      setKitchen((prev) => ({ ...prev, is_aktiv: newStatus }));
      setSnackbar({
        open: true,
        message: `Oshxona ${newStatus ? 'saytda ko‘rinadi' : 'saytdan yashirildi'}!`,
        severity: 'success',
      });
    } catch (err) {
      console.error('PATCH error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      let errorMessage = 'Holatni o‘zgartirishda xatolik';
      if (err.code === 'ERR_INTERNET_DISCONNECTED') {
        errorMessage = 'Internet ulanishingiz yo‘q. Iltimos, tarmoqni tekshiring.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Autentifikatsiya xatosi: Iltimos, qayta tizimga kiring.';
        window.location.href = '/login';
      } else if (err.response?.status === 404) {
        errorMessage = `Oshxona (ID: ${kitchen.id}) topilmadi.`;
      } else {
        errorMessage = err.response?.data?.message || err.response?.data?.detail || errorMessage;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsToggling(false);
    }
  }, [token, kitchen]);

  // Komponent yuklanganda ma'lumotlarni olish
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Snackbarni yopish
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Token yo‘q bo‘lsa
  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => (window.location.href = '/login')}>
              Tizimga kirish
            </Button>
          }
        >
          Iltimos, tizimga kiring!
        </Alert>
      </Box>
    );
  }

  // Yuklanmoqda holati
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography ml={2}>Ma’lumotlar yuklanmoqda...</Typography>
      </Box>
    );
  }

  // Xato holati
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchData}>
              Qayta urinish
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Asosiy interfeys
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: { xs: 2, sm: 4 } }}>
        <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
          <CardContent>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary" mb={3}>
              Oshxona Admin Profili
            </Typography>

            {profile && (
              <Paper elevation={0} sx={{ p: 'backgroundColor', bgcolor: 3, mb: 2, borderRadius: '2', boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ display: 'flex', 'alignItems': 'center', mb: 2 }}>
                  <Avatar sx={{ width: '80', 'height': '80px', 'mr': '3', 'bgcolor': 'primary.main', 'fontSize': '2rem' }}>
                    <PersonIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {profile.username || 'Foydalanuvchi nomi yo‘q'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Telefon: {profile.kitchen_admin_profile?.phone_number || 'Kiritilmagan'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {kitchen && (
              <Paper elevation={0} sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary" mb={2}>
                  Oshxona Ma’lumotlari
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  <ListItem disableGutters sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        <WorkIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Oshxona Nomi"
                      secondary={kitchen.name || profile.kitchen_admin_profile?.kitchen_name || 'Noma’lum'}
                      secondaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        <PhoneIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Telefon Raqami"
                      secondary={profile.kitchen_admin_profile?.phone_number || 'Kiritilmagan'}
                      secondaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem disableGutters sx={{ py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'secondary.light' }}>
                        <WorkIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Holat"
                      secondary={kitchen.is_aktiv ? 'Online' : 'Offline'}
                      secondaryTypographyProps={{ color: kitchen.is_aktiv ? 'success.main' : 'text.primary' }}
                    />
                    </ListItem>
                  </List>
                <Divider sx={{ my: 2 }} />
                <Tooltip title="Oshxonani saytda ko‘rsatish yoki yashirish uchun bosing">
                  <Button
                    variant="contained"
                    color={kitchen.is_aktiv ? 'secondary' : 'primary'}
                    startIcon={<WorkIcon />}
                    onClick={handleToggleWorkStatus}
                    sx={{ mt: 3, borderRadius: '2', width: '100%' }}
                    disabled={isToggling}
                  >
                    {isToggling ? (
                      <CircularProgress size="24" color="inherit" />
                    ) : kitchen.is_aktiv ? 'Ishni tugatish' : 'Ishni boshlash'}
                  </Button>
                </Tooltip>
              </Paper>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
            icon={<CheckIcon fontSize="inherit" />}
            onClose={handleCloseSnackbar}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default KitchenProfile;