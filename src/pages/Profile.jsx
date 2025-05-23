import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Avatar, Button, Card, CardContent,
  Divider, Grid, Paper, List, ListItem, ListItemText, ListItemAvatar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Tooltip
} from '@mui/material';
import {
  ExitToApp as LogoutIcon, Edit as EditIcon, Phone as PhoneIcon, Badge as BadgeIcon,
  Person as PersonIcon, Check as CheckIcon, Close as CloseIcon, Work as WorkIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [longPress, setLongPress] = useState(false);
  const navigate = useNavigate();

  const PROFILE_URL = 'https://hosilbek.pythonanywhere.com/api/user/me/';
  const COURIER_PROFILE_URL = 'https://hosilbek.pythonanywhere.com/api/user/couriers/';
  const BASE_URL = 'https://hosilbek.pythonanywhere.com';

  const getAxiosConfig = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  let longPressTimeout = null;
  const LONG_PRESS_DURATION = 1000;

  const handleMouseDown = () => {
    console.log('Mouse down: Uzoq bosish boshlandi');
    longPressTimeout = setTimeout(() => {
      setLongPress(true);
      setConfirmDeleteOpen(true);
      console.log('Long press: Delete dialog ochildi');
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = () => {
    console.log('Mouse up: Uzoq bosish to‘xtadi');
    clearTimeout(longPressTimeout);
    setLongPress(false);
  };

  useEffect(() => {
    fetchProfile();
    return () => clearTimeout(longPressTimeout);
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(PROFILE_URL, getAxiosConfig(token));
      const userProfile = response.data;
      console.log('Profil ma’lumotlari yuklandi:', userProfile);

      userProfile.courier_profile = {
        id: userProfile.courier_profile?.id || null,
        is_active: userProfile.courier_profile?.is_active ?? false,
        ...userProfile.courier_profile
      };

      console.log('Kuryer profili ID si:', userProfile.courier_profile.id);
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      setProfile(userProfile);

      if (!userProfile.roles?.is_kitchen_admin) {
        localStorage.setItem(
          'authError',
          'Siz kuryer sifatida ro‘yxatdan o‘tmagansiz. Tizimga kirish uchun login sahifasiga qayting.'
        );
        clearLocalStorage();
        navigate('/login', { replace: true });
        return;
      }

      if (!userProfile.courier_profile.id) {
        setError('Kuryer profili ID si topilmadi. Backend bilan bog‘laning');
        console.error('Kuryer profili xatosi: ID yo‘q', userProfile.courier_profile);
      }

      setError('');
    } catch (err) {
      handleError(err, 'Profil ma’lumotlarini olishda xato yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
  };  const handleError = (err, defaultMessage) => {
    let errorMessage = defaultMessage;
    if (err.response) {
      console.error('API xato javobi:', err.response.data, 'Status:', err.response.status);
      if (err.response.status === 401) {
        errorMessage = 'Sessiya tugagan. Iltimos, qayta kiring';
        clearLocalStorage();
        navigate('/login', { replace: true });
      } else if (err.response.status === 404) {
        errorMessage = 'Kuryer profili topilmadi yoki endpoint noto‘g‘ri. Backend bilan bog‘laning';
      } else if (err.response.status === 400) {
        errorMessage = err.response.data.non_field_errors
          ? `Backend xatosi: ${err.response.data.non_field_errors.join(', ')}`
          : err.response.data?.errors
          ? `Backend xatosi: ${JSON.stringify(err.response.data.errors)}`
          : 'So‘rovda xato: Backend is_active maydonini qabul qilmadi. Formatni tekshiring';
      } else {
        errorMessage = err.response.data?.detail || 
                       err.response.data?.message || 
                       'Server bilan aloqa xatosi';
      }
    } else if (err.request) {
      errorMessage = 'Internet aloqasi yo‘q';
      console.error('So‘rov yuborilmadi:', err.request);
    } else {
      errorMessage = 'Noma’lum xato: ' + err.message;
      console.error('Noma’lum xato:', err);
    }
    setError(errorMessage);
  };

  const handleLogout = () => {
    clearLocalStorage();
    navigate('/login', { replace: true });
  };

  const handleEditClick = () => {
    setEditData({
      phone_number: profile.courier_profile?.phone_number || '',
      passport_number: profile.courier_profile?.passport_number || '',
      passport_series: profile.courier_profile?.passport_series || ''
    });
    setEditErrors({});
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
    let error = '';
    if (name === 'phone_number' && value && !/^\+?[1-9]\d{1,14}$/.test(value)) {
      error = 'Telefon raqami noto‘g‘ri formatda';
    } else if (name === 'passport_number' && value && !/^\d{7,9}$/.test(value)) {
      error = 'Pasport raqami 7-9 raqamdan iborat bo‘lishi kerak';
    } else if (name === 'passport_series' && value && !/^[A-Z]{1,2}\d{0,7}$/.test(value)) {
      error = 'Pasport seriyasi noto‘g‘ri formatda';
    }
    setEditErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSaveChanges = async () => {
    if (Object.values(editErrors).some(error => error)) {
      setError('Iltimos, xatolarni tuzating');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const response = await axios.patch(
        PROFILE_URL,
        { courier_profile: editData },
        getAxiosConfig(token)
      );

      setProfile(response.data);
      console.log('Profil yangilandi:', response.data);
      localStorage.setItem('userProfile', JSON.stringify(response.data));
      setSnackbarMessage('Profil muvaffaqiyatli yangilandi!');
      setSnackbarOpen(true);
      setEditMode(false);
    } catch (err) {
      handleError(err, 'Profilni yangilashda xato yuz berdi');
    }
  };

  const handleToggleWorkStatus = async () => {
    if (longPress) {
      console.log('Long press aniqlandi, toggle ishlamaydi');
      return;
    }

    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi. Backend bilan bog‘laning');
      console.error('courier_profile.id yo‘q:', profile?.courier_profile);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      return;
    }

    const newStatus = !profile.courier_profile.is_active;
    const updateUrl = `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`;    try {
      setIsToggling(true);
      console.log('PATCH so‘rov:', {
        url: updateUrl,
        data: { is_active: newStatus },
        headers: { Authorization: `Bearer ${token}` }
      });

      const response = await axios.patch(
        updateUrl,
        { is_active: newStatus },
        getAxiosConfig(token)
      );

      console.log('PATCH javobi:', response.data);
      setProfile(prev => {
        const updatedProfile = {
          ...prev,
          courier_profile: { ...prev.courier_profile, is_active: newStatus }
        };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        return updatedProfile;
      });
      setSnackbarMessage(
        newStatus ? 'Siz ishga chiqdingiz!' : 'Siz ishni tugatdingiz!'
      );
      setSnackbarOpen(true);
    } catch (err) {
      console.error('PATCH xatosi:', err.response?.data, 'Status:', err.response?.status);
      handleError(err, 'Ish holatini yangilashda xato yuz berdi');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profile?.courier_profile?.id) {
      setError('Kuryer profili ID si topilmadi. Backend bilan bog‘laning');
      setConfirmDeleteOpen(false);
      console.error('courier_profile.id yo‘q:', profile?.courier_profile);
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      setConfirmDeleteOpen(false);
      return;
    }

    const deleteUrl = `${COURIER_PROFILE_URL}${profile.courier_profile.id}/`;

    try {
      setIsToggling(true);
      console.log('DELETE so‘rov:', {
        url: deleteUrl,
        headers: { Authorization: `Bearer ${token}` }
      });

      await axios.delete(deleteUrl, getAxiosConfig(token));

      console.log('Profil o‘chirildi');
      setSnackbarMessage('Kuryer profili o‘chirildi!');
      setSnackbarOpen(true);
      clearLocalStorage();
      navigate('/login', { replace: true });
    } catch (err) {
      handleError(err, 'Profilni o‘chirishda xato yuz berdi');
    } finally {
      setIsToggling(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
    setLongPress(false);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'background.default',
      py: 4,
      px: { xs: 2, sm: 4 }
    }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card elevation={3} sx={{ 
            borderRadius: 3,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                  Mening Kuryer Profilim
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ borderRadius: 2 }}
                >
                  Chiqish
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}              {profile && (
                <>
                  <Paper elevation={0} sx={{ 
                    p: 3, 
                    mb: 3,
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Avatar 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mr: 3, 
                          bgcolor: 'primary.main',
                          fontSize: '2rem'
                        }} 
                        src={profile.courier_profile?.photo ? `${BASE_URL}${profile.courier_profile.photo}` : undefined}
                      >
                        {!profile.courier_profile?.photo && (
                          <PersonIcon fontSize="large" />
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          {profile.username || 'Foydalanuvchi nomi yo‘q'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {profile.email || 'Email kiritilmagan'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Ro‘yxatdan o‘tgan sana: {new Date(profile.date_joined || Date.now()).toLocaleDateString('uz-UZ')}
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Uzoq bosib turing profilni o‘chirish uchun">
                      <Button
                        variant="contained"
                        color={profile.courier_profile?.is_active ? "secondary" : "primary"}
                        startIcon={<WorkIcon />}
                        onClick={handleToggleWorkStatus}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        sx={{ mt: 2, borderRadius: 2 }}
                        disabled={isToggling || !profile.courier_profile?.id}
                      >
                        {isToggling ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          profile.courier_profile?.is_active ? 'Ishni tugatish' : 'Ishga chiqish'
                        )}
                      </Button>
                    </Tooltip>
                  </Paper>                  {profile.courier_profile && (
                    <Paper elevation={0} sx={{ 
                      p: 3,
                      backgroundColor: 'background.paper',
                      borderRadius: 2,
                      position: 'relative'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          Kuryer Ma’lumotlari
                        </Typography>
                        <IconButton 
                          color="primary"
                          onClick={handleEditClick}
                          sx={{ 
                            backgroundColor: 'primary.light',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <List disablePadding>
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                              <BadgeIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="Pasport Raqami"
                            secondary={profile.courier_profile.passport_number || 'Kiritilmagan'}
                            secondaryTypographyProps={{ color: 'text.primary' }}
                          />
                        </ListItem>

                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                              <BadgeIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="Pasport Seriyasi"
                            secondary={profile.courier_profile.passport_series || 'Kiritilmagan'}
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
                            secondary={profile.courier_profile.phone_number || 'Kiritilmagan'}
                            secondaryTypographyProps={{ color: 'text.primary' }}
                          />
                        </ListItem>                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                              <WorkIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="Ish Holati"
                            secondary={profile.courier_profile.is_active ? 'Online' : 'Offline'}
                            secondaryTypographyProps={{ color: profile.courier_profile.is_active ? 'success.main' : 'text.primary' }}
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={editMode} onClose={() => setEditMode(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <span>Profilni Tahrirlash</span>
          <IconButton onClick={() => setEditMode(false)} color="inherit">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon Raqami"
                name="phone_number"
                value={editData.phone_number}
                onChange={handleEditChange}
                variant="outlined"
                margin="normal"
                error={!!editErrors.phone_number}
                helperText={editErrors.phone_number}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pasport Raqami"
                name="passport_number"
                value={editData.passport_number}
                onChange={handleEditChange}
                variant="outlined"
                margin="normal"
                error={!!editErrors.passport_number}
                helperText={editErrors.passport_number}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pasport Seriyasi"
                name="passport_series"
                value={editData.passport_series}
                onChange={handleEditChange}
                variant="outlined"
                margin="normal"
                error={!!editErrors.passport_series}
                helperText={editErrors.passport_series}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setEditMode(false)}
            variant="outlined"
            color="secondary"
            startIcon={<CloseIcon />}
          >
            Bekor Qilish
          </Button>
          <Button 
            onClick={handleSaveChanges}
            variant="contained"
            color="primary"
            startIcon={<CheckIcon />}
            disabled={Object.values(editErrors).some(error => error)}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>      <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Kuryer Profilini O‘chirish
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>
            Haqiqatan ham kuryer profilini o‘chirmoqchimisiz? Bu amal qaytarilmaydi va tizimdan chiqasiz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleConfirmDeleteClose}
            variant="outlined"
            color="secondary"
            startIcon={<CloseIcon />}
          >
            Yo‘q
          </Button>
          <Button
            onClick={handleDeleteProfile}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={isToggling}
          >
            Ha
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="success" 
          sx={{ width: '100%' }}
          icon={<CheckIcon fontSize="inherit" />}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;