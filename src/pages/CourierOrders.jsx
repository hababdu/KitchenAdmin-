import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import newOrderSound from '../assets/notification.mp3';
import timerExpiredSound from '../assets/notification.mp3';
import orderAcceptedSound from '../assets/notification.mp3';
import orderDeliveredSound from '../assets/notification.mp3';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Grid,
  Paper,
  Badge,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Collapse,
  useMediaQuery,
  ThemeProvider,
  createTheme
} from '@mui/material';
import {
  Refresh,
  CheckCircle,
  LocalShipping,
  Restaurant,
  Payment,
  LocationOn,
  Phone,
  AccessTime,
  Notifications as NotificationsIcon,
  ExpandMore,
  ExpandLess,
  Assignment,
  Edit,
  Timer,
  Search
} from '@mui/icons-material';

const ORDERS_API = 'https://hosilbek.pythonanywhere.com/api/user/orders/';
const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ACCEPT_ORDER_API = 'https://hosilbek.pythonanywhere.com/api/user/orders/';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#f50057' },
    background: { default: '#f5f7fa' },
    error: { main: '#d32f2f' }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 6px 24px rgba(0,0,0,0.15)' }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          padding: '12px 16px'
        }
      }
    }
  }
});

const AdminOrdersDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [kitchenHours, setKitchenHours] = useState('');
  const [kitchenMinutes, setKitchenMinutes] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isInitialFetch, setIsInitialFetch] = useState(true);
  const [timers, setTimers] = useState({});

  const sounds = {
    newOrder: new Audio(newOrderSound),
    timerExpired: new Audio(timerExpiredSound),
    orderAccepted: new Audio(orderAcceptedSound),
    orderDelivered: new Audio(orderDeliveredSound),
  };

  const token = localStorage.getItem('authToken');
  const timerRefs = useRef({});

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    if (!token) {
      setError('Tizimga kirish talab qilinadi');
      localStorage.setItem('authError', 'Tizimga kirish talab qilinadi. Iltimos, login qiling.');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(ORDERS_API, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];
      const newOrders = ordersData.filter(
        newOrder => !orders.some(prevOrder => prevOrder.id === newOrder.id)
      );
      if (!isInitialFetch && newOrders.length > 0) {
        setNewOrdersCount(prev => prev + newOrders.length);
        if (soundEnabled) {
          sounds.newOrder.play().catch(err => console.error('Yangi buyurtma ovoz xatosi:', err));
        }
      }

      ordersData.forEach(order => {
        const prevOrder = orders.find(o => o.id === order.id);
        if (prevOrder && prevOrder.status !== order.status) {
          if (order.status === 'kuryer_oldi' && soundEnabled) {
            sounds.orderAccepted.play().catch(err => console.error('Buyurtma qabul qilindi ovoz xatosi:', err));
          } else if (['yetkazib_berildi', 'buyurtma_topshirildi'].includes(order.status) && soundEnabled) {
            sounds.orderDelivered.play().catch(err => console.error('Yetkazib berildi ovoz xatosi:', err));
          }
        }
      });

      setOrders(ordersData);
      setLastFetch(new Date().toISOString());
      setIsInitialFetch(false);

      ordersData.forEach(order => {
        if (order.kitchen_time && order.status === 'kuryer_oldi') {
          startTimer(order.id, order.kitchen_time, order.kitchen_time_set_at);
        } else if (['kuryer_yolda', 'yetkazib_berildi', 'buyurtma_topshirildi'].includes(order.status)) {
          stopTimer(order.id);
        }
      });
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchError = err => {
    let errorMessage = 'Buyurtmalarni olishda xato yuz berdi';
    if (err.response) {
      if (err.response.status === 401) {
        errorMessage = 'Sessiya tugagan. Iltimos, qayta kiring';
        localStorage.setItem('authError', errorMessage);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userProfile');
        navigate('/login', { replace: true });
      } else {
        errorMessage = err.response.data?.detail || err.response.data?.message || JSON.stringify(err.response.data) || errorMessage;
      }
    } else if (err.request) {
      errorMessage = 'Internet aloqasi yo‘q';
    }
    setError(errorMessage);
  };

  const handleAcceptOrder = async orderId => {
    if (!token) {
      setError('Tizimga kirish talab qilinadi');
      return;
    }

    try {
      await axios.post(
        `${ACCEPT_ORDER_API}${orderId}/accept/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (soundEnabled) {
        sounds.orderAccepted.play().catch(err => console.error('Buyurtma qabul qilindi ovoz xatosi:', err));
      }
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Buyurtmani qabul qilishda xato');
    }
  };

  const openEditDialog = order => {
    setCurrentOrder(order);
    if (order.kitchen_time) {
      if (typeof order.kitchen_time === 'string' && order.kitchen_time.includes(':')) {
        const [hours, minutes] = order.kitchen_time.split(':').map(Number);
        setKitchenHours(hours || '');
        setKitchenMinutes(minutes || '');
      } else {
        const totalMinutes = parseInt(order.kitchen_time);
        setKitchenHours(Math.floor(totalMinutes / 60));
        setKitchenMinutes(totalMinutes % 60);
      }
    } else {
      setKitchenHours('');
      setKitchenMinutes('');
    }
    setDialogError('');
    setEditDialogOpen(true);
  };

  const startTimer = (orderId, kitchenTime, kitchenTimeSetAt) => {
    let totalSeconds;
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      totalSeconds = hours * 3600 + minutes * 60;
    } else {
      totalSeconds = parseInt(kitchenTime) * 60;
    }

    let remainingSeconds = totalSeconds;
    if (kitchenTimeSetAt) {
      const setTime = new Date(kitchenTimeSetAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - setTime) / 1000);
      remainingSeconds = totalSeconds - elapsedSeconds;
    } else {
      const timerKey = `timer_start_${orderId}`;
      let startTime = localStorage.getItem(timerKey);
      if (!startTime) {
        startTime = new Date().toISOString();
        localStorage.setItem(timerKey, startTime);
      }
      const setTime = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - setTime) / 1000);
      remainingSeconds = totalSeconds - elapsedSeconds;
    }

    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
    }

    setTimers(prev => ({ ...prev, [orderId]: remainingSeconds }));

    timerRefs.current[orderId] = setInterval(() => {
      setTimers(prev => {
        const newTime = prev[orderId] - 1;
        if (newTime === 0 && soundEnabled) {
          sounds.timerExpired.play().catch(err => console.error('Timer tugadi ovoz xatosi:', err));
        }
        return { ...prev, [orderId]: newTime };
      });
    }, 1000);
  };

  const stopTimer = orderId => {
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[orderId];
        return newTimers;
      });
      localStorage.removeItem(`timer_start_${orderId}`);
    }
  };

  const handleUpdateKitchenTime = async () => {
    if (!currentOrder) {
      setDialogError('Buyurtma tanlanmagan');
      return;
    }

    const hours = parseInt(kitchenHours) || 0;
    const minutes = parseInt(kitchenMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 5 || totalMinutes > 180) {
      setDialogError('Vaqt 5 daqiqadan 3 soatgacha bo‘lishi kerak');
      return;
    }

    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    try {
      if (!token) {
        setDialogError('Tizimga qayta kirish kerak');
        navigate('/login', { replace: true });
        return;
      }

      await axios.patch(
        `${ORDERS_API}${currentOrder.id}/`,
        { kitchen_time: formattedTime, kitchen_time_set_at: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditDialogOpen(false);
      setKitchenHours('');
      setKitchenMinutes('');
      fetchOrders();
      if (currentOrder.status === 'kuryer_oldi') {
        startTimer(currentOrder.id, formattedTime, new Date().toISOString());
      }
    } catch (err) {
      setDialogError(err.response?.data?.detail || 'Vaqtni yangilashda xato');
    }
  };

  const testSound = () => {
    if (soundEnabled) {
      sounds.newOrder.play().catch(err => console.error('Yangi buyurtma sinov ovozi xatosi:', err));
      setTimeout(() => sounds.timerExpired.play().catch(err => console.error('Timer sinov ovozi xatosi:', err)), 1000);
      setTimeout(() => sounds.orderAccepted.play().catch(err => console.error('Qabul qilindi sinov ovozi xatosi:', err)), 2000);
      setTimeout(() => sounds.orderDelivered.play().catch(err => console.error('Yetkazildi sinov ovozi xatosi:', err)), 3000);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => {
      clearInterval(interval);
      Object.values(timerRefs.current).forEach(clearInterval);
    };
  }, []);

  const formatTimer = seconds => {
    if (seconds === undefined || seconds === null) return 'Belgilanmagan';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    const timeString = `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return isNegative ? `-${timeString}` : timeString;
  };

  const getStatusChip = status => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'primary', icon: <AccessTime /> },
      oshxona_vaqt_belgiladi: { label: 'Oshxona vaqt belgilaydi', color: 'info', icon: <Timer /> },
      kuryer_oldi: { label: 'Kuryer oldi', color: 'secondary', icon: <CheckCircle /> },
      kuryer_yolda: { label: 'Yetkazilmoqda', color: 'warning', icon: <LocalShipping /> },
      yetkazib_berildi: { label: 'Yetkazib berildi', color: 'success', icon: <CheckCircle /> },
      buyurtma_topshirildi: { label: 'Topshirildi', color: 'success', icon: <CheckCircle /> }
    };
    const config = statusMap[status] || { label: status, color: 'default', icon: null };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        variant="filled"
        sx={{ fontWeight: 'bold', borderRadius: '8px' }}
      />
    );
  };

  const formatTime = kitchenTime => {
    if (!kitchenTime) return 'Belgilanmagan';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat` : ''} ${minutes > 0 ? `${minutes} minut` : ''}`.trim();
    }
    const hours = Math.floor(kitchenTime / 60);
    const mins = kitchenTime % 60;
    return `${hours > 0 ? `${hours} soat` : ''} ${mins > 0 ? `${mins} minut` : ''}`.trim();
  };

  const filteredOrders = orders.filter(
    order =>
      order.id.toString().includes(searchQuery) ||
      order.user?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newOrders = filteredOrders.filter(o => ['buyurtma_tushdi', 'oshxona_vaqt_belgiladi'].includes(o.status));
  const acceptedOrders = filteredOrders.filter(o => o.status === 'kuryer_oldi');
  const inDeliveryOrders = filteredOrders.filter(o => o.status === 'kuryer_yolda');
  const completedOrders = filteredOrders.filter(o => o.status === 'yetkazib_berildi' || o.status === 'buyurtma_topshirildi');

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
        {error}
        <Button onClick={fetchOrders} sx={{ ml: 2, color: 'error.main' }}>Qayta urinish</Button>
      </Alert>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: isMobile ? 2 : 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" color="primary.main">
            Buyurtmalar Boshqaruvi
            {newOrdersCount > 0 && (
              <Badge badgeContent={newOrdersCount} color="error" sx={{ ml: 2 }}>
                <NotificationsIcon />
              </Badge>
            )}
          </Typography>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: isMobile ? 2 : 0 }}>
            <TextField
              size="small"
              placeholder="ID yoki mijoz bo'yicha qidirish"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
              sx={{ width: isMobile ? '100%' : 300 }}
            />
            <FormControlLabel
              control={<Switch checked={soundEnabled} onChange={() => setSoundEnabled(prev => !prev)} />}
              label="Ovozli bildirishnomalar"
            />
            <Button variant="outlined" onClick={testSound}>
              Ovoz sinovi
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchOrders}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Yangilash
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={isMobile ? 2 : 3} mb={4}>
          {[
            { title: 'Jami Buyurtmalar', value: orders.length, color: 'text.primary' },
            { title: 'Yangi Buyurtmalar', value: newOrders.length, color: 'primary.main' },
            { title: 'Qabul qilingan', value: acceptedOrders.length, color: 'secondary.main' },
            { title: 'Yetkazilmoqda', value: inDeliveryOrders.length, color: 'warning.main' },
            { title: 'Bajarilgan', value: completedOrders.length, color: 'success.main' }
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderLeft: `4px solid ${item.color}`,
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {item.title}
                </Typography>
                <Typography variant="h5" color={item.color} fontWeight="bold">
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
          sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
        >
          <Tab label={`Yangi (${newOrders.length})`} />
          <Tab label={`Kuryer oldi (${acceptedOrders.length})`} />
          <Tab label={`Kuryer yolda (${inDeliveryOrders.length})`} />
          <Tab label={`Tugatildi (${completedOrders.length})`} />
          <Tab label={`Barchasi (${orders.length})`} />
        </Tabs>

        <Box>
          {[
            newOrders,
            acceptedOrders,
            inDeliveryOrders,
            completedOrders,
            filteredOrders
          ][activeTab].length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Ushbu bo‘limda buyurtmalar mavjud emas
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 2 : 3}>
              {[
                newOrders,
                acceptedOrders,
                inDeliveryOrders,
                completedOrders,
                filteredOrders
              ][activeTab].map(order => (
                <Grid item xs={12} key={order.id}>
                  <Card
                    sx={{
                      borderLeft: `4px solid ${
                        order.status === 'buyurtma_tushdi' || order.status === 'oshxona_vaqt_belgiladi'
                          ? theme.palette.primary.main
                          : order.status === 'kuryer_oldi'
                          ? theme.palette.secondary.main
                          : order.status === 'kuryer_yolda'
                          ? theme.palette.warning.main
                          : theme.palette.success.main
                      }`
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          #{order.id}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getStatusChip(order.status)}
                          <IconButton onClick={() => toggleOrderExpand(order.id)}>
                            {expandedOrder === order.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Restoran: {order.kitchen?.name || 'Mavjud emas'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mijoz: {order.user}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={order.status === 'kuryer_oldi' && timers[order.id] < 0 ? 'error.main' : 'text.secondary'}
                          sx={{ fontWeight: order.status === 'kuryer_oldi' && timers[order.id] < 0 ? 'bold' : 'normal' }}
                        >
                          {order.status === 'kuryer_oldi' && timers[order.id] !== undefined
                            ? `Qolgan vaqt: ${formatTimer(timers[order.id])}`
                            : `Oshxona vaqti: ${formatTime(order.kitchen_time)}`}
                        </Typography>
                      </Stack>
                      <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
                        {['buyurtma_tushdi', 'oshxona_vaqt_belgiladi'].includes(order.status) && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<Edit />}
                              onClick={() => openEditDialog(order)}
                            >
                              Vaqt belgilash
                            </Button>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              startIcon={<CheckCircle />}
                              onClick={() => handleAcceptOrder(order.id)}
                            >
                              Buyurtmani olish
                            </Button>
                          </>
                        )}
                      </Stack>
                      <Collapse in={expandedOrder === order.id}>
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 3 }} />
                          <Grid container spacing={isMobile ? 2 : 3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                                Buyurtma Tafsilotlari
                              </Typography>
                              <Stack spacing={2}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Phone fontSize="small" color="action" />
                                  <Typography variant="body2">{order.contact_number}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="body2">{order.shipping_address}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Timer fontSize="small" color="action" />
                                  <Typography variant="body2">Oshxona vaqti: {formatTime(order.kitchen_time)}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Payment fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    To‘lov: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}
                                  </Typography>
                                </Stack>
                                {order.notes && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Assignment fontSize="small" color="action" />
                                    <Typography variant="body2">Eslatmalar: {order.notes}</Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                                Mahsulotlar ({order.items.length})
                              </Typography>
                              <List dense>
                                {order.items.map((item, index) => (
                                  <ListItem key={index} sx={{ py: 1 }}>
                                    <ListItemAvatar>
                                      <Avatar
                                        variant="rounded"
                                        src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                                        sx={{ bgcolor: 'grey.200', width: 40, height: 40 }}
                                      >
                                        <Restaurant fontSize="small" />
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={item.product?.title || 'Noma’lum Mahsulot'}
                                      secondary={`${item.quantity} × ${item.price} so‘m`}
                                    />
                                    <Typography variant="body2" fontWeight="bold">
                                      {(item.quantity * parseFloat(item.price)).toLocaleString('uz-UZ')} so‘m
                                    </Typography>
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Oshxona Vaqtini Belgilash
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3}>
              <TextField
                label="Soat"
                type="number"
                fullWidth
                value={kitchenHours}
                onChange={e => setKitchenHours(e.target.value)}
                InputProps={{ inputProps: { min: 0, max: 3 } }}
                helperText="0-3 soat"
              />
              <TextField
                label="Minut"
                type="number"
                fullWidth
                value={kitchenMinutes}
                onChange={e => setKitchenMinutes(e.target.value)}
                InputProps={{ inputProps: { min: 0, max: 59 } }}
                helperText="0-59 minut"
              />
              {dialogError && <Alert severity="error">{dialogError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Bekor qilish</Button>
            <Button
              variant="contained"
              onClick={handleUpdateKitchenTime}
              disabled={!kitchenHours && !kitchenMinutes}
            >
              Saqlash
            </Button>
          </DialogActions>
        </Dialog>

        {lastFetch && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
            Oxirgi yangilanish: {new Date(lastFetch).toLocaleString('uz-UZ')}
          </Typography>
        )}
      </Box>
    </ThemeProvider>
  );

  function toggleOrderExpand(orderId) {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  }
};

export default AdminOrdersDashboard;