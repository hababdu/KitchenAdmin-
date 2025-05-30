import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Stack, Button, Card, CardContent,
  Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, IconButton, ThemeProvider, createTheme, useMediaQuery,
  Tabs, Tab, FormControlLabel, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, Divider
} from '@mui/material';
import {
  Refresh, Edit, Timer, ArrowBack, AccessTime, AssignmentReturn, Person,
  Phone, LocationOn, Payment, Restaurant, Assignment
} from '@mui/icons-material';

// Audio file
import newOrderSound from '../assets/notification.mp3';

// API settings
const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/orders/`;

// Responsive theme
const theme = createTheme({
  palette: {
    primary: { main: '#0288d1' },
    error: { main: '#d32f2f' },
    success: { main: '#388e3c' },
    warning: { main: '#f57c00' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h5: { fontWeight: 700, fontSize: '1.4rem' },
    subtitle1: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.9rem' },
    caption: { fontSize: '0.85rem' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
          marginBottom: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize: '0.95rem',
          fontWeight: '600',
          textTransform: 'none',
          padding: '10px 20px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: { 
        paper: { borderRadius: '12px', padding: '16px' } 
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { 
          textTransform: 'none', 
          fontWeight: '600', 
          fontSize: '0.9rem',
          minHeight: '48px',
          padding: '0 12px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '8px', fontSize: '0.9rem' },
        head: { fontWeight: 'bold', backgroundColor: '#f5f5f5' },
      },
    },
  },
});

const CourierOrders = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [kitchenMinutes, setKitchenMinutes] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [userInteracted, setUserInteracted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const audioRef = useRef(null);

  // Initialize audio
  const initializeAudio = () => {
    try {
      const audio = new Audio(newOrderSound);
      audio.volume = 1;
      audio.load();
      audioRef.current = audio;
    } catch (err) {
      console.error('Audio initialization error:', err);
      setError('Ovoz faylini yuklashda xato.');
    }
  };

  // Detect user interaction
  useEffect(() => {
    initializeAudio();

    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        console.log('User interacted with the page');
      }
    };

    const events = ['click', 'touchstart', 'mousedown', 'keydown', 'mousemove'];
    events.forEach(event => window.addEventListener(event, handleInteraction));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleInteraction));
    };
  }, []);

  // Fetch orders
  const fetchOrders = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Tizimga kirish talab qilinadi');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];
   

      const buyurtmaTushdiOrders = ordersData.filter(o => o.status === 'buyurtma_tushdi');
      

      if (buyurtmaTushdiOrders.length > 0) {
        setSuccess(`${buyurtmaTushdiOrders.length} ta yangi buyurtma!`);
        if (soundEnabled && userInteracted && audioRef.current) {
          try {
            await audioRef.current.play();
          } catch (err) {
            console.error('Sound playback error:', err);
            setError('Ovoz ijro etilmadi. Audio faylni tekshiring.');
          }
        } else {
          console.log('Sound not played:', { soundEnabled, userInteracted, audioLoaded: !!audioRef.current });
        }
      }

      setOrders(ordersData);
    } catch (err) {
      let errorMessage = 'Ma\'lumotlarni olishda xato';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan. Qayta kiring';
          localStorage.removeItem('authToken');
          navigate('/login', { replace: true });
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Internet aloqasi yo\'q';
      }
      setError(errorMessage);
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog
  const openEditDialog = order => {
    setCurrentOrder(order);
    setKitchenMinutes('');
    setDialogError('');
    setEditDialogOpen(true);
  };

  // Update kitchen time
  const handleUpdateKitchenTime = async () => {
    if (!currentOrder) {
      setDialogError('Buyurtma tanlanmadi');
      return;
    }

    const minutes = parseInt(kitchenMinutes) || 0;
    if (minutes < 5 || minutes > 180) {
      setDialogError('Vaqt 5-180 daqiqa oralig\'ida bo\'lishi kerak');
      return;
    }

    const formattedTime = `00:${String(minutes).padStart(2, '0')}`;
    const token = localStorage.getItem('authToken');
    try {
      await axios.patch(
        `${ORDERS_API}${currentOrder.id}/`,
        { 
          kitchen_time: formattedTime, 
          kitchen_time_set_at: new Date().toISOString(),
          status: 'oshxona_vaqt_belgiladi'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditDialogOpen(false);
      fetchOrders();
    } catch (err) {
      setDialogError(err.response?.data?.detail || 'Vaqtni yangilashda xato');
    }
  };

  // Calculate total price
  const calculateTotalPrice = items => {
    return items.reduce((total, item) => total + item.quantity * parseFloat(item.price), 0).toLocaleString('uz-UZ');
  };

  // Format kitchen time
  const formatTime = kitchenTime => {
    if (!kitchenTime) return 'Belgilanmagan';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat ` : ''}${minutes} minut`;
    }
    return 'Belgilanmagan';
  };

  // Format timestamp
  const formatTimestamp = timestamp => {
    if (!timestamp) return 'Noma\'lum';
    return new Date(timestamp).toLocaleString('uz-UZ');
  };

  // Status label
  const getStatusLabel = status => {
    const statusMap = {
      buyurtma_tushdi: 'Yangi',
      oshxona_vaqt_belgiladi: 'Vaqt belgilangan',
      kuryer_oldi: 'Kuryer oldi',
      qaytarildi: 'Qaytarildi',
    };
    return statusMap[status] || status;
  };

  // Filter orders by tab
  const newOrders = orders.filter(o => o.status === 'buyurtma_tushdi');
  const timeSetOrders = orders.filter(o => o.status === 'oshxona_vaqt_belgiladi');
  const acceptedOrders = orders.filter(o => o.status === 'kuryer_oldi');
  const returnedOrders = orders.filter(o => o.status === 'qaytarildi');

  // Fetch orders on mount and every 30 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 2 : 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" color="primary.main">
              Buyurtmalar
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FormControlLabel
              control={
                <Switch 
                  checked={soundEnabled} 
                  onChange={() => setSoundEnabled(prev => !prev)} 
                  color="primary"
                />
              }
              label="Ovoz"
              sx={{ '& .MuiTypography-root': { fontSize: '0.9rem' } }}
            />
            <IconButton 
              onClick={fetchOrders} 
              sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
            >
              <Refresh />
            </IconButton>
          </Stack>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          sx={{ mb: 2, bgcolor: 'white', borderRadius: '12px', px: 1 }}
        >
          <Tab label={`Yangi (${newOrders.length})`} icon={<AccessTime fontSize="small" />} iconPosition="start" />
          <Tab label={`Vaqt belgilangan (${timeSetOrders.length})`} icon={<Timer fontSize="small" />} iconPosition="start" />
          <Tab label={`Kuryer oldi (${acceptedOrders.length})`} icon={<AccessTime fontSize="small" />} iconPosition="start" />
          <Tab label={`Qaytarilganlar (${returnedOrders.length})`} icon={<AssignmentReturn fontSize="small" />} iconPosition="start" />
        </Tabs>

        {/* Orders List */}
        <Box>
          {[
            newOrders,
            timeSetOrders,
            acceptedOrders,
            returnedOrders
          ][activeTab].length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
              Bu bo'limda buyurtmalar mavjud emas
            </Typography>
          ) : (
            [
              newOrders,
              timeSetOrders,
              acceptedOrders,
              returnedOrders
            ][activeTab].map(order => (
              <Card key={order.id} sx={{ mb: 2 }}>
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Buyurtma #{order.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Status: {getStatusLabel(order.status)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Umumiy narx: {calculateTotalPrice(order.items)} so'm
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <Timer fontSize="small" /> Oshxona vaqti: {formatTime(order.kitchen_time)}
                  </Typography>

                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Buyurtma Tafsilotlari
                            </Typography>
                            <Stack spacing={1}>
                            <Stack direction="row" spacing={1}  alignItems="center">
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">Mijoz: {order.user?.name || 'Noma\'lum'}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Phone fontSize="small" color="action" />
                              <Typography
                              color='blue'
                              variant="body2"
                              component="a"
                              href={`tel:${order.contact_number}`}
                              sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline' } }}
                              >
                              Telefon: {order.contact_number || 'Noma\'lum'}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LocationOn fontSize="small" color="action" />
                              <Typography variant="body2">Manzil: {order.address || 'Noma\'lum'}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Payment fontSize="small" color="action" />
                              <Typography variant="body2">To'lov turi: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Restaurant fontSize="small" color="action" />
                              <Typography variant="body2">Restoran: {order.kitchen?.name || 'Noma\'lum'}</Typography>
                            </Stack>
                            {order.notes && (
                              <Stack direction="row" spacing={1} alignItems="center">
                              <Assignment fontSize="small" color="action" />
                              <Typography variant="body2">Eslatmalar: {order.notes}</Typography>
                              </Stack>
                            )}
                            {order.status === 'oshxona_vaqt_belgiladi' && (
                              <>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Timer fontSize="small" color="action" />
                                <Typography variant="body2">Vaqt belgilandi: {formatTimestamp(order.kitchen_time_set_at)}</Typography>
                              </Stack>
                              </>
                            )}
                            {order.status === 'kuryer_oldi' && (
                              <>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Person fontSize="small" color="action" />
                                <Typography variant="body2">Kuryer: {order.courier?.user?.username || 'Noma\'lum'}</Typography>
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Phone fontSize="small" color="action" />
                                <Typography
                                variant="body2"
                                component="a"
                                href={`tel:${order.courier?.phone_number}`}
                                sx={{ textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline' } }}
                                >
                                Kuryer raqami: {order.courier?.phone_number || 'Noma\'lum'}
                                </Typography>
                              </Stack>
                              </>
                            )}
                            {order.status === 'qaytarildi' && order.return_reason && (
                              <Stack direction="row" spacing={1} alignItems="center">
                              <Assignment fontSize="small" color="action" />
                              <Typography variant="body2">Qaytarish sababi: {order.return_reason}</Typography>
                              </Stack>
                            )}
                            </Stack>

                                      <Divider sx={{ my: 2 }} />
                                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                      Mahsulotlar ({order.items.length})
                                      </Typography>
                                      <TableContainer component={Paper} sx={{ maxHeight: 200, overflow: 'auto' }}>
                                      <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
                                        <TableHead>
                                        <TableRow>
                                          <TableCell sx={{ width: isMobile ? '50px' : '60px' }}>Rasm</TableCell>
                                          <TableCell>Mahsulot</TableCell>
                                          <TableCell align="right" sx={{ width: isMobile ? '60px' : '80px' }}>Soni</TableCell>
                                          <TableCell align="right" sx={{ width: isMobile ? '80px' : '100px' }}>Narxi</TableCell>
                                          <TableCell align="right" sx={{ width: isMobile ? '80px' : '100px' }}>Umumiy</TableCell>
                                        </TableRow>
                                        </TableHead>
                                        <TableBody>
                                        {order.items.map((item, index) => (
                                          <TableRow key={index}>
                                          <TableCell>
                                            <Avatar
                                            variant="rounded"
                                            src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                                            sx={{ bgcolor: 'grey.200', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}
                                            >
                                            <Restaurant fontSize="small" />
                                            </Avatar>
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2">{item.product?.title || 'Noma\'lum'}</Typography>
                                            {item.notes && (
                                            <Typography variant="caption" color="text.secondary">{item.notes}</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell align="right">{item.quantity}</TableCell>
                                          <TableCell align="right">{parseFloat(item.price).toLocaleString('uz-UZ')} so'm</TableCell>
                                          <TableCell align="right">{(item.quantity * parseFloat(item.price)).toLocaleString('uz-UZ')} so'm</TableCell>
                                          </TableRow>
                                        ))}
                                        </TableBody>
                                      </Table>
                                      </TableContainer>

                                      {/* Total Price */}
                                      <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, textAlign: 'right' }}>
                                      Jami summa: {calculateTotalPrice(order.items)} so'm
                                      </Typography>

                                      {/* Action Button */}
                                      {order.status === 'buyurtma_tushdi' && (
                                      <Button
                                        variant="contained"
                                        startIcon={<Edit />}
                                        onClick={() => openEditDialog(order)}
                                        sx={{ mt: 2, width: '100%' }}
                                      >
                                        Vaqt belgilash
                                      </Button>
                                      )}
                                    </CardContent>
                                    </Card>
                                  ))
                                  )}
                                </Box>

                                {/* Kitchen Time Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Oshxona vaqtini belgilash
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Daqiqa"
              type="number"
              fullWidth
              value={kitchenMinutes}
              onChange={e => setKitchenMinutes(e.target.value)}
              InputProps={{ 
                inputProps: { min: 5, max: 180 },
                endAdornment: <InputAdornment position="end">min</InputAdornment>
              }}
              helperText="5-180 daqiqa"
              size="small"
              sx={{ mt: 2 }}
            />
            {dialogError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {dialogError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEditDialogOpen(false)} 
              variant="outlined"
            >
              Bekor
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateKitchenTime}
              disabled={!kitchenMinutes}
            >
              Saqlash
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default CourierOrders;