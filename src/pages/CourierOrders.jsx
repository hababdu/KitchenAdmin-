import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Stack, Button, Card, CardContent, Divider,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Grid, Tabs, Tab, TextField, Switch, FormControlLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, Drawer, IconButton, Select, MenuItem, InputAdornment, Collapse, Avatar
} from '@mui/material';
import {
  Refresh, CheckCircle, Restaurant, Payment, LocationOn, Phone, AccessTime, Assignment,
  Edit, Timer, Search, ArrowBack, FilterList, Close, ExpandMore, ExpandLess, Person
} from '@mui/icons-material';
import { createTheme, ThemeProvider, useMediaQuery } from '@mui/material';

// Ovoz fayllari
import newOrderSound from '../assets/notification.mp3';
import timerExpiredSound from '../assets/notification.mp3';
import orderAcceptedSound from '../assets/notification.mp3';

// API sozlamalari
const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/orders/`;
const ACCEPT_ORDER_API = `${BASE_URL}/api/user/orders/`;

// Zamonaviy tema
const theme = createTheme({
  palette: {
    primary: { main: '#0288d1' },
    secondary: { main: '#7b1fa2' },
    error: { main: '#d32f2f' },
    warning: { main: '#f57c00' },
    success: { main: '#388e3c' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: { fontWeight: 700, fontSize: '1.6rem' },
    h6: { fontWeight: 600, fontSize: '1.2rem' },
    subtitle1: { fontWeight: 600, fontSize: '0.95rem' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.85rem' },
    caption: { fontSize: '0.8rem' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease',
          '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: '600',
          textTransform: 'none',
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { 
          textTransform: 'none', 
          fontWeight: '600', 
          fontSize: '0.9rem',
          minHeight: '48px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { 
        root: { 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        } 
      },
    },
    MuiDialog: {
      styleOverrides: { 
        paper: { 
          borderRadius: '12px',
          padding: '16px',
        } 
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 12px',
          fontSize: '0.85rem',
        },
        head: {
          fontWeight: 'bold',
          backgroundColor: '#f5f5f5',
        },
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
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [kitchenMinutes, setKitchenMinutes] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [timers, setTimers] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRefs = useRef({});

  // Ovozlar
  const sounds = {
    newOrder: new Audio(newOrderSound),
    timerExpired: new Audio(timerExpiredSound),
    orderAccepted: new Audio(orderAcceptedSound),
  };

  // Foydalanuvchi o'zaro ta'sirini aniqlash
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Buyurtmalarni olish
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
      setOrders(ordersData);
      setLastUpdate(new Date());

      // Taymerlarni boshqarish
      ordersData.forEach(order => {
        if (order.kitchen_time && order.status === 'kuryer_oldi') {
          startTimer(order.id, order.kitchen_time, order.kitchen_time_set_at);
        } else {
          stopTimer(order.id);
        }
      });

      // Yangi buyurtmalar uchun ovoz
      const newOrdersCount = ordersData.filter(o => o.status === 'buyurtma_tushdi').length;
      if (
        newOrdersCount > orders.filter(o => o.status === 'buyurtma_tushdi').length &&
        soundEnabled &&
        userInteracted
      ) {
        sounds.newOrder.play().catch(err => console.error('Yangi buyurtma ovozi xatosi:', err));
      }
    } catch (err) {
      let errorMessage = 'Buyurtmalarni olishda xato yuz berdi';
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
    } finally {
      setLoading(false);
    }
  };

  // Buyurtmani qabul qilish
  const acceptOrder = async (orderId) => {
    const token = localStorage.getItem('authToken');
    try {
      await axios.patch(
        `${ACCEPT_ORDER_API}${orderId}/`,
        { status: 'kuryer_oldi' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (soundEnabled && userInteracted) {
        sounds.orderAccepted.play().catch(err => console.error('Qabul qilindi ovozi xatosi:', err));
      }
      
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.detail || 'Buyurtmani qabul qilishda xato');
    }
  };

  // Oshxona vaqtini tahrirlash
  const openEditDialog = order => {
    setCurrentOrder(order);
    if (order.kitchen_time) {
      const minutes = parseInt(order.kitchen_time.split(':')[1]) || '';
      setKitchenMinutes(minutes);
    } else {
      setKitchenMinutes('');
    }
    setDialogError('');
    setEditDialogOpen(true);
  };

  // Oshxona vaqtini yangilash
  const handleUpdateKitchenTime = async () => {
    if (!currentOrder) {
      setDialogError('Buyurtma tanlanmagan');
      return;
    }

    const minutes = parseInt(kitchenMinutes) || 0;
    if (minutes < 5 || minutes > 180) {
      setDialogError('Vaqt 5 daqiqadan 3 soatgacha bo\'lishi kerak');
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

  // Taymerni boshlash
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
      remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
    }

    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
    }

    setTimers(prev => ({ ...prev, [orderId]: remainingSeconds }));
    timerRefs.current[orderId] = setInterval(() => {
      setTimers(prev => {
        const newTime = prev[orderId] - 1;
        if (newTime <= 0 && soundEnabled && userInteracted) {
          sounds.timerExpired.play().catch(err => console.error('Taymer tugadi ovozi xatosi:', err));
        }
        return { ...prev, [orderId]: Math.max(newTime, 0) };
      });
    }, 1000);
  };

  // Taymerni to'xtatish
  const stopTimer = orderId => {
    if (timerRefs.current[orderId]) {
      clearInterval(timerRefs.current[orderId]);
      delete timerRefs.current[orderId];
      setTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[orderId];
        return newTimers;
      });
    }
  };

  // Taymer formatlash
  const formatTimer = seconds => {
    if (seconds === undefined || seconds === null) return 'Belgilanmagan';
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Umumiy narxni hisoblash
  const calculateTotalPrice = items => {
    return items.reduce((total, item) => total + item.quantity * parseFloat(item.price), 0).toLocaleString('uz-UZ');
  };

  // Status chip
  const getStatusChip = status => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'primary', icon: <AccessTime /> },
      oshxona_vaqt_belgiladi: { label: 'Vaqt belgilangan', color: 'warning', icon: <Timer /> },
      kuryer_oldi: { label: 'Kuryer oldi', color: 'success', icon: <CheckCircle /> },
    };
    const config = statusMap[status] || { label: status, color: 'default', icon: null };
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        sx={{ 
          fontWeight: 'bold', 
          borderRadius: '8px',
          px: 1,
          '& .MuiChip-icon': { ml: 0.5 }
        }}
      />
    );
  };

  // Vaqt formatlash
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

  // Buyurtmalarni filtrlash va saralash
  const filteredOrders = orders
    .filter(order =>
      order.id.toString().includes(searchQuery) ||
      order.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contact_number?.includes(searchQuery)
    )
    .sort((a, b) => (sortOrder === 'asc' ? a.id - b.id : b.id - a.id));

  const newOrders = filteredOrders.filter(o => o.status === 'buyurtma_tushdi');
  const timeSetOrders = filteredOrders.filter(o => o.status === 'oshxona_vaqt_belgiladi');
  const acceptedOrders = filteredOrders.filter(o => o.status === 'kuryer_oldi');

  // Buyurtma kengaytirish
  const toggleOrderExpand = orderId => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // Ovoz sinovi
  const testSound = () => {
    if (soundEnabled && userInteracted) {
      sounds.newOrder.play().catch(err => console.error('Yangi buyurtma sinov xatosi:', err));
      setTimeout(() => sounds.orderAccepted.play().catch(err => console.error('Qabul qilindi sinov xatosi:', err)), 1000);
      setTimeout(() => sounds.timerExpired.play().catch(err => console.error('Taymer sinov xatosi:', err)), 2000);
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

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '80vh',
        backgroundColor: 'background.default'
      }}>
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: isMobile ? 2 : 3, backgroundColor: 'background.default' }}>
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            alignItems: 'center'
          }}
          action={
            <Button 
              onClick={fetchOrders} 
              color="inherit" 
              size="small"
              startIcon={<Refresh />}
            >
              Qayta urinish
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        p: isMobile ? 2 : 3, 
        bgcolor: 'background.default', 
        minHeight: '100vh',
        maxWidth: '100%',
        overflowX: 'hidden'
      }}>
        {/* Sarlavha va boshqaruv elementlari */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton 
              onClick={() => navigate(-1)} 
              color="primary"
              sx={{ 
                backgroundColor: 'primary.light', 
                '&:hover': { backgroundColor: 'primary.main', color: 'white' }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" color="primary.main">
              Kuryer Buyurtmalari
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton 
              onClick={fetchOrders} 
              color="primary"
              sx={{ 
                backgroundColor: 'primary.light', 
                '&:hover': { backgroundColor: 'primary.main', color: 'white' },
                display: isMobile ? 'flex' : 'none'
              }}
            >
              <Refresh />
            </IconButton>
            <IconButton 
              onClick={() => setFilterDrawerOpen(true)} 
              color="primary"
              sx={{ 
                backgroundColor: 'primary.light', 
                '&:hover': { backgroundColor: 'primary.main', color: 'white' },
                display: isMobile ? 'flex' : 'none'
              }}
            >
              <FilterList />
            </IconButton>
          </Stack>
        </Stack>

        {/* Filtrlar va qidiruv */}
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mb: 3, alignItems: isMobile ? 'stretch' : 'center' }}>
          <TextField
            size="small"
            placeholder="ID, mijoz ismi yoki telefon bo'yicha qidirish"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '8px',
                backgroundColor: 'white',
              },
            }}
            sx={{ 
              flex: isMobile ? 1 : '0 1 300px',
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'divider' },
                '&:hover fieldset': { borderColor: 'primary.light' },
              }
            }}
          />
          {!isMobile && (
            <>
              <FormControlLabel
                control={
                  <Switch 
                    checked={soundEnabled} 
                    onChange={() => setSoundEnabled(prev => !prev)} 
                    color="primary"
                  />
                }
                label="Ovozli bildirishnomalar"
                sx={{ ml: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={testSound}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    borderColor: 'primary.dark'
                  }
                }}
              >
                Ovoz sinovi
              </Button>
              <Select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                sx={{ 
                  width: 120, 
                  bgcolor: 'white', 
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.light'
                  }
                }}
                size="small"
              >
                <MenuItem value="desc">Yangi</MenuItem>
                <MenuItem value="asc">Eski</MenuItem>
              </Select>
              <Button 
                variant="contained" 
                startIcon={<Refresh />} 
                onClick={fetchOrders}
                sx={{
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                Yangilash
              </Button>
            </>
          )}
        </Stack>

        {/* Statistikalar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { title: 'Jami', value: orders.length, color: 'text.primary', icon: <Assignment /> },
            { title: 'Yangi', value: newOrders.length, color: 'primary.main', icon: <AccessTime /> },
            { title: 'Vaqt belgilangan', value: timeSetOrders.length, color: 'warning.main', icon: <Timer /> },
            { title: 'Kuryer oldi', value: acceptedOrders.length, color: 'success.main', icon: <CheckCircle /> },
          ].map((item, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper sx={{ 
                p: 2, 
                borderRadius: '12px', 
                borderLeft: `4px solid ${item.color}`, 
                textAlign: 'center', 
                bgcolor: 'white',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1 }}>
                  {React.cloneElement(item.icon, { fontSize: 'small', color: 'action' })}
                  <Typography variant={isMobile ? 'caption' : 'subtitle2'} color="text.secondary">
                    {item.title}
                  </Typography>
                </Stack>
                <Typography variant={isMobile ? 'h6' : 'h5'} color={item.color} fontWeight="bold">
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Oxirgi yangilanish vaqti */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'right' }}>
          Oxirgi yangilanish: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Noma\'lum'}
        </Typography>

        {/* Bo'limlar */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          sx={{ 
            mb: 3, 
            bgcolor: 'white', 
            borderRadius: '12px', 
            px: isMobile ? 1 : 2,
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab 
            label={`Yangi (${newOrders.length})`} 
            sx={{ minWidth: 'unset', px: isMobile ? 1 : 2 }}
          />
          <Tab 
            label={`Vaqt belgilangan (${timeSetOrders.length})`} 
            sx={{ minWidth: 'unset', px: isMobile ? 1 : 2 }}
          />
          <Tab 
            label={`Kuryer oldi (${acceptedOrders.length})`} 
            sx={{ minWidth: 'unset', px: isMobile ? 1 : 2 }}
          />
        </Tabs>

        {/* Buyurtmalar ro'yxati */}
        <Box>
          {[
            newOrders,
            timeSetOrders,
            acceptedOrders
          ][activeTab].length === 0 ? (
            <Paper sx={{ 
              p: isMobile ? 2 : 3, 
              textAlign: 'center', 
              borderRadius: '12px', 
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary">
                Ushbu bo'limda buyurtmalar mavjud emas
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 1.5 : 2}>
              {[
                newOrders,
                timeSetOrders,
                acceptedOrders
              ][activeTab].map(order => (
                <Grid item xs={12} key={order.id}>
                  <Card sx={{ 
                    borderLeft: `4px solid ${theme.palette[getStatusChip(order.status).props.color].main}`, 
                    bgcolor: 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                    }
                  }}>
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold">
                          Buyurtma #{order.id}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getStatusChip(order.status)}
                          <IconButton 
                            onClick={() => toggleOrderExpand(order.id)}
                            size="small"
                            sx={{
                              backgroundColor: 'action.hover',
                              '&:hover': {
                                backgroundColor: 'action.selected'
                              }
                            }}
                          >
                            {expandedOrder === order.id ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Umumiy narx: <strong>{calculateTotalPrice(order.items)} so'm</strong>
                        </Typography>
                        {order.status === 'kuryer_oldi' && timers[order.id] !== undefined ? (
                          <Typography
                            variant="body2"
                            color={timers[order.id] < 0 ? 'error.main' : 'text.secondary'}
                            sx={{ 
                              fontWeight: timers[order.id] < 0 ? 'bold' : 'normal',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <Timer fontSize="inherit" />
                            Qolgan vaqt: {formatTimer(timers[order.id])}
                          </Typography>
                        ) : (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <Timer fontSize="inherit" />
                            Oshxona vaqti: {formatTime(order.kitchen_time)}
                          </Typography>
                        )}
                      </Stack>
                      {order.status === 'kuryer_oldi' && (
                        <Typography 
                          variant="body1" 
                          color="error.main" 
                          fontWeight="bold" 
                          sx={{ 
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          <Payment fontSize="inherit" />
                          Kuryer to'lovi: {calculateTotalPrice(order.items)} so'm
                        </Typography>
                      )}
                      {['buyurtma_tushdi', 'oshxona_vaqt_belgiladi'].includes(order.status) && (
                        <Stack direction={isMobile ? 'column' : 'row'} spacing={1}>
                          {order.status === 'buyurtma_tushdi' && (
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<Edit />}
                              onClick={() => openEditDialog(order)}
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                backgroundColor: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.dark'
                                }
                              }}
                            >
                              Vaqt belgilash
                            </Button>
                          )}
                          {order.status === 'oshxona_vaqt_belgiladi' && (
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => acceptOrder(order.id)}
                              size={isMobile ? 'small' : 'medium'}
                              sx={{
                                backgroundColor: 'success.main',
                                '&:hover': {
                                  backgroundColor: 'success.dark'
                                }
                              }}
                            >
                              Qabul qilish
                            </Button>
                          )}
                        </Stack>
                      )}
                      <Collapse in={expandedOrder === order.id}>
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 3 }} />
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                                Buyurtma Tafsilotlari
                              </Typography>
                              <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Person fontSize="small" color="action" />
                                  <Typography variant="body1">
                                    Mijoz: {order.user || 'Noma\'lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Phone fontSize="small" color="action" />
                                  <Typography variant="body1">
                                    Telefon: {order.contact_number || 'Noma\'lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="body1">
                                    Manzil: {order.address || 'Noma\'lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Payment fontSize="small" color="action" />
                                  <Typography variant="body1">
                                    To'lov turi: {order.payment === 'naqd' ? 'Naqd' : 'Karta'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Restaurant fontSize="small" color="action" />
                                  <Typography variant="body1">
                                    Restoran: {order.kitchen?.name || 'Noma\'lum'}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Timer fontSize="small" color="action" />
                                  <Typography variant="body1">
                                    Oshxona vaqti: {formatTime(order.kitchen_time)}
                                  </Typography>
                                </Stack>
                                {order.status === 'kuryer_oldi' && order.courier && (
                                  <>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Person fontSize="small" color="action" />
                                      <Typography variant="body1">
                                        Kuryer: {order.courier.user?.username || 'Noma\'lum'}
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Phone fontSize="small" color="action" />
                                      <Typography variant="body1">
                                        Kuryer raqami: {order.courier.phone_number || 'Noma\'lum'}
                                      </Typography>
                                    </Stack>
                                  </>
                                )}
                                {order.notes && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Assignment fontSize="small" color="action" />
                                    <Typography variant="body1">
                                      Eslatmalar: {order.notes}
                                    </Typography>
                                  </Stack>
                                )}
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body1" fontWeight="bold">
                                    Umumiy narx: {calculateTotalPrice(order.items)} so'm
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                                Mahsulotlar ({order.items.length})
                              </Typography>
                              <TableContainer 
                                component={Paper} 
                                sx={{ 
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                                  borderRadius: '8px',
                                  maxHeight: 300,
                                  overflow: 'auto'
                                }}
                              >
                                <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ width: '60px' }}>Rasm</TableCell>
                                      <TableCell>Mahsulot</TableCell>
                                      <TableCell align="right">Soni</TableCell>
                                      <TableCell align="right">Narxi</TableCell>
                                      <TableCell align="right">Umumiy</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {order.items.map((item, index) => (
                                      <TableRow key={index} hover>
                                        <TableCell>
                                          <Avatar
                                            variant="rounded"
                                            src={item.product?.photo ? `${BASE_URL}${item.product.photo}` : undefined}
                                            sx={{ 
                                              bgcolor: 'grey.200', 
                                              width: isMobile ? 32 : 40, 
                                              height: isMobile ? 32 : 40 
                                            }}
                                          >
                                            <Restaurant fontSize="small" />
                                          </Avatar>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {item.product?.title || 'Noma\'lum'}
                                          </Typography>
                                          {item.notes && (
                                            <Typography variant="caption" color="text.secondary">
                                              {item.notes}
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">
                                          {parseFloat(item.price).toLocaleString('uz-UZ')} so'm
                                        </TableCell>
                                        <TableCell align="right">
                                          {(item.quantity * parseFloat(item.price)).toLocaleString('uz-UZ')} so'm
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
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

        {/* Oshxona vaqtini tahrirlash dialogi */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          sx={{ 
            '& .MuiDialog-paper': { 
              borderRadius: '12px', 
              p: isMobile ? 2 : 3,
              bgcolor: 'background.paper'
            } 
          }}
        >
          <DialogTitle sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            px: 0,
            pt: 0
          }}>
            Oshxona vaqtini belgilash
          </DialogTitle>
          <DialogContent sx={{ px: 0 }}>
            <Stack spacing={2} sx={{ mt: isMobile ? 1 : 2 }}>
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
                helperText="5-180 daqiqa oralig'ida kiriting"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'primary.light' },
                  }
                }}
              />
              {dialogError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: '8px',
                    alignItems: 'center'
                  }}
                >
                  {dialogError}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button 
              onClick={() => setEditDialogOpen(false)} 
              variant="outlined" 
              size={isMobile ? 'small' : 'medium'}
              sx={{
                borderColor: 'text.secondary',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'text.primary',
                  color: 'text.primary'
                }
              }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateKitchenTime}
              disabled={!kitchenMinutes}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                },
                '&:disabled': {
                  backgroundColor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              Saqlash
            </Button>
          </DialogActions>
        </Dialog>

        {/* Mobil uchun filtrlar */}
        <Drawer
          anchor="left"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          sx={{ 
            '& .MuiDrawer-paper': { 
              width: isMobile ? '85%' : '320px', 
              p: 3,
              bgcolor: 'background.paper'
            } 
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              Sozlashlar
            </Typography>
            <IconButton 
              onClick={() => setFilterDrawerOpen(false)}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary'
                }
              }}
            >
              <Close />
            </IconButton>
          </Stack>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Saralash
              </Typography>
              <Select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                fullWidth
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.light'
                  }
                }}
              >
                <MenuItem value="desc">Yangi buyurtmalar birinchi</MenuItem>
                <MenuItem value="asc">Eski buyurtmalar birinchi</MenuItem>
              </Select>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                Bildirishnomalar
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={soundEnabled} 
                    onChange={() => setSoundEnabled(prev => !prev)} 
                    color="primary"
                  />
                }
                label="Ovozli bildirishnomalar"
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mx: 0
                }}
              />
              <Button 
                variant="outlined" 
                onClick={testSound}
                fullWidth
                sx={{
                  mt: 1,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    borderColor: 'primary.dark'
                  }
                }}
              >
                Ovoz sinovi
              </Button>
            </Box>
            
            <Button 
              variant="contained" 
              startIcon={<Refresh />} 
              onClick={fetchOrders}
              fullWidth
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }}
            >
              Ma'lumotlarni yangilash
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Oxirgi yangilanish: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Noma\'lum'}
            </Typography>
          </Stack>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default CourierOrders;