import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Stack, Button, Card, CardContent,
  Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, IconButton, ThemeProvider, createTheme, useMediaQuery,
  Tabs, Tab, FormControlLabel, Switch,
  Tooltip, Menu, MenuItem, ListItemIcon, Fab, useScrollTrigger, Zoom, Badge,
  Paper, Divider, Chip, Grid
} from '@mui/material';
import {
  Refresh, Edit, Timer, ArrowBack, AccessTime, AssignmentReturn, Person,
  Phone, LocationOn, Payment, Restaurant, Notifications,
  MoreVert, CheckCircle, DirectionsBike, DoneAll, FilterList,
  KeyboardArrowUp, Print
} from '@mui/icons-material';

// Audio file
import newOrderSound from '../assets/notification.mp3';

// API settings
const BASE_URL = 'https://hosilbek02.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/orders/`;

// Custom theme with responsive adjustments
const theme = createTheme({
  palette: {
    primary: { main: '#0288d1' },
    secondary: { main: '#7b1fa2' },
    error: { main: '#d32f2f' },
    warning: { main: '#f57c00' },
    success: { main: '#388e3c' },
    info: { main: '#0288d1' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
    text: { primary: '#212121', secondary: '#757575' },
  },
  typography: {
    fontFamily: [
      '"Inter"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.5px',
      '@media (max-width:600px)': {
        fontSize: '1.2rem',
      },
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.85rem',
      },
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '0.75rem',
      },
    },
    caption: {
      fontSize: '0.8rem',
      color: '#757575',
      '@media (max-width:600px)': {
        fontSize: '0.7rem',
      },
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.95rem',
      '@media (max-width:600px)': {
        fontSize: '0.85rem',
      },
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
          },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '@media (max-width:600px)': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '0.95rem',
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
          '&:hover': { boxShadow: '0 5px 10px rgba(0,0,0,0.15)' },
          minWidth: '120px',
          '@media (max-width:600px)': {
            padding: '8px 16px',
            minWidth: '100px',
            fontSize: '0.85rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          padding: '16px',
          '@media (max-width:600px)': {
            margin: '16px',
            padding: '12px',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fff',
          borderRadius: '12px 12px 0 0',
          padding: '0 8px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 16px',
          fontSize: '0.9rem',
          minHeight: '48px',
          minWidth: 'unset',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 600,
          padding: '6px 12px',
          fontSize: '0.85rem',
        },
      },
    },
  },
});

// Scroll to top button component
function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector(
      '#back-to-top-anchor',
    );
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

const KitchenOrders = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const audioRef = useRef(null);

  const token = localStorage.getItem('authToken');

  // Initialize audio
  const initializeAudio = useCallback(() => {
    try {
      const audio = new Audio(newOrderSound);
      audio.volume = 0.5;
      audio.preload = 'auto';
      audio.load();
      audioRef.current = audio;
    } catch (err) {
      console.error('Audio initialization error:', err);
      setError('Ovoz faylini yuklashda xato.');
    }
  }, []);

  // Print receipt function
  const printReceipt = useCallback((order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Chop etish oynasini ochib bo\'lmadi. Iltimos, brauzer sozlamalarini tekshiring.');
      return;
    }

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Buyurtma #${order.id} Cheki</title>
        <style>
          body {
            font-family: monospace;
            margin: 10px;
            font-size: 12px;
            line-height: 1.2;
            width: 58mm;
          }
          .receipt {
            width: 100%;
            padding: 5px;
            border: 1px solid #000;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 3px;
            margin-bottom: 5px;
          }
          .header h2 {
            font-size: 14px;
            margin: 0;
          }
          .header p {
            margin: 2px 0;
            font-size: 10px;
          }
          .info p {
            margin: 2px 0;
            font-size: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            font-size: 10px;
          }
          .total {
            font-weight: bold;
            border-top: 1px dashed #000;
            padding-top: 3px;
            margin-top: 5px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>Buyurtma #${order.id}</h2>
            <p>${order.kitchen?.name || 'Noma\'lum'}</p>
            <p>${formatTimestamp(order.created_at)}</p>
          </div>
          <div class="info">
            <p>Mijoz: ${order.user || 'Noma\'lum'}</p>
            <p>Telefon: ${order.contact_number || 'Noma\'lum'}</p>
            <p>To'lov: ${order.payment === 'naqd' ? 'Naqd' : 'Karta'}</p>
            <p>Vaqt: ${formatTime(order.kitchen_time)}</p>
          </div>
          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.product?.title || 'Noma\'lum'}</span>
                <span>${(item.quantity * parseFloat(item.price)).toLocaleString('uz-UZ')} so'm</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>Jami:</span>
            <span>${calculateTotalPrice(order.items)} so'm</span>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
  }, []);

  // Check token and fetch orders
  const fetchOrders = useCallback(async () => {
    if (!token) {
      setError('Tizimga kirish talab qilinadi');
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(ORDERS_API, {
        headers: { Authorization: `Token ${token}` },
      });

      const ordersData = Array.isArray(response.data) ? response.data : [];

      // Calculate new orders since last fetch
      const buyurtmaTushdiOrders = ordersData.filter(o => o.status === 'buyurtma_tushdi');

      if (orders.length > 0) {
        const newOrders = buyurtmaTushdiOrders.filter(
          newOrder => !orders.some(oldOrder => oldOrder.id === newOrder.id)
        );
        setNewOrderCount(newOrders.length);
      } else {
        setNewOrderCount(buyurtmaTushdiOrders.length);
      }

      // Play sound and show notification if there are new buyurtma_tushdi orders
      if (buyurtmaTushdiOrders.length > 0) {
        setSuccess(`${buyurtmaTushdiOrders.length} ta yangi buyurtma!`);
        if (soundEnabled && userInteracted && audioRef.current) {
          try {
            await audioRef.current.play();
          } catch (err) {
            console.error('Sound playback error:', err);
          }
        }
      } else {
        setSuccess('');
      }

      setOrders(ordersData);
    } catch (err) {
      let errorMessage = 'Ma\'lumotlarni olishda xato';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Sessiya tugagan. Qayta kiring';
          localStorage.removeItem('authToken');
          localStorage.removeItem('userProfile');
          localStorage.removeItem('roles');
          navigate('/login', { replace: true });
        } else if (err.response.status === 404) {
          errorMessage = 'Buyurtmalar endpointi topilmadi. Server bilan bog\'laning.';
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage;
        }
      } else if (err.request) {
        errorMessage = 'Internet aloqasi yo\'q';
      } else {
        errorMessage = err.message || 'Noma\'lum xato';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, navigate, orders.length, soundEnabled, userInteracted]);

  // Open edit dialog
  const openEditDialog = useCallback((order) => {
    setCurrentOrder(order);
    setKitchenMinutes('');
    setDialogError('');
    setEditDialogOpen(true);
  }, []);

  // Update kitchen time
  const handleUpdateKitchenTime = useCallback(async () => {
    if (!currentOrder) {
      setDialogError('Buyurtma tanlanmadi');
      return;
    }

    const minutes = parseInt(kitchenMinutes) || 0;
    if (minutes < 5 || minutes > 180) {
      setDialogError('Vaqt 5-180 daqiqa oralig\'ida bo\'lishi kerak');
      return;
    }

    try {
      await axios.patch(
        `${ORDERS_API}${currentOrder.id}/`,
        {
          kitchen_time: minutes,
          kitchen_time_set_at: new Date().toISOString(),
          status: 'oshxona_vaqt_belgiladi'
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      setEditDialogOpen(false);
      fetchOrders();
      setSuccess('Vaqt muvaffaqiyatli yangilandi!');
    } catch (err) {
      setDialogError(err.response?.data?.detail || 'Vaqtni yangilashda xato');
    }
  }, [currentOrder, kitchenMinutes, token, fetchOrders]);

  // Calculate total price
  const calculateTotalPrice = useCallback((items) => {
    return items.reduce((total, item) => total + item.quantity * parseFloat(item.price), 0).toLocaleString('uz-UZ');
  }, []);

  // Format kitchen time
  const formatTime = useCallback((kitchenTime) => {
    if (!kitchenTime) return 'Belgilanmagan';
    if (typeof kitchenTime === 'string' && kitchenTime.includes(':')) {
      const [hours, minutes] = kitchenTime.split(':').map(Number);
      return `${hours > 0 ? `${hours} soat ` : ''}${minutes} minut`;
    } else if (typeof kitchenTime === 'number') {
      const hours = Math.floor(kitchenTime / 60);
      const minutes = kitchenTime % 60;
      return `${hours > 0 ? `${hours} soat ` : ''}${minutes} minut`;
    }
    return 'Belgilanmagan';
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return 'Noma\'lum';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) +
           ', ' + date.toLocaleDateString('uz-UZ');
  }, []);

  // Status label with colors
  const getStatusLabel = useCallback((status, isChip = false) => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'warning', icon: <CheckCircle /> },
      oshxona_vaqt_belgiladi: { label: 'Vaqt belgilandi', color: 'info', icon: <Timer /> },
      kuryer_oldi: { label: 'Kuryer oldi', color: 'primary', icon: <DirectionsBike /> },
      qaytarildi: { label: 'Qaytarildi', color: 'error', icon: <AssignmentReturn /> },
      buyurtma_topshirildi: { label: 'Yakunlangan', color: 'success', icon: <DoneAll /> },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'default', icon: <CheckCircle /> };

    if (isChip) {
      return (
        <Chip
          label={statusInfo.label}
          color={statusInfo.color}
          icon={statusInfo.icon}
          size="small"
          variant="filled"
          sx={{ fontWeight: 'bold', bgcolor: `${statusInfo.color}.light`, color: `${statusInfo.color}.dark` }}
        />
      );
    }
    return statusInfo.label;
  }, []);

  // Filter orders by tab
  const filteredOrders = useMemo(() => [
    orders.filter(o => o.status === 'buyurtma_tushdi'),
    orders.filter(o => o.status === 'oshxona_vaqt_belgiladi'),
    orders.filter(o => o.status === 'kuryer_oldi'),
    orders.filter(o => o.status === 'buyurtma_topshirildi'),
    orders.filter(o => o.status === 'qaytarildi'),
  ], [orders]);

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: '<your-public-vapid-key>', // Replace with your VAPID public key
      });
      await axios.post(
        `${BASE_URL}/api/push-subscription/`,
        subscription,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      console.log('Push subscription sent to backend');
    } catch (error) {
      console.error('Push subscription failed:', error);
      setError('Push bildirishnomalarga obuna bo‘lishda xato');
    }
  };

  // Request notification permission and subscribe
  useEffect(() => {
    initializeAudio();

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          subscribeToPush();
        } else {
          setError('Bildirishnomalarni yoqish uchun ruxsat berish kerak');
        }
      });
    }

    const handleInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
      }
    };

    const events = ['click', 'touchstart', 'mousedown', 'keydown', 'mousemove'];
    events.forEach(event => window.addEventListener(event, handleInteraction));

    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'PLAY_NOTIFICATION_SOUND' && soundEnabled && userInteracted && audioRef.current) {
        audioRef.current.play().catch(err => console.error('Sound playback error:', err));
      }
    });

    return () => {
      events.forEach(event => window.removeEventListener(event, handleInteraction));
    };
  }, [initializeAudio, userInteracted, soundEnabled]);

  // Register periodic sync
  useEffect(() => {
    async function registerPeriodicSync() {
      if ('serviceWorker' in navigator && 'PeriodicSyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        try {
          await registration.periodicSync.register('check-orders', {
            minInterval: 10 * 1000,
          });
          console.log('Periodic sync registered');
        } catch (error) {
          console.error('Periodic sync registration failed:', error);
        }
      }
    }
    registerPeriodicSync();
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket('wss://hosilbek02.pythonanywhere.com/ws/orders/');
    ws.onmessage = event => {
      const newOrder = JSON.parse(event.data);
      if (newOrder.status === 'buyurtma_tushdi') {
        setSuccess(`Yangi Buyurtma #${newOrder.id}!`);
        setNewOrderCount(prev => prev + 1);
        if (soundEnabled && userInteracted && audioRef.current) {
          audioRef.current.play().catch(err => console.error('Sound playback error:', err));
        }
        fetchOrders();
      }
    };
    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => {
        // Attempt to reconnect
      }, 1000);
    };
    return () => ws.close();
  }, [soundEnabled, userInteracted, fetchOrders]);

  // Fetch orders on mount and every 10 seconds
  useEffect(() => {
    if (token) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    } else {
      setError('Tizimga kirish talab qilinadi');
      navigate('/login', { replace: true });
    }
  }, [token, navigate, fetchOrders]);

  // Reset new order count after showing notification
  useEffect(() => {
    if (newOrderCount > 0) {
      const timer = setTimeout(() => setNewOrderCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newOrderCount]);

  if (loading && orders.length === 0) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            bgcolor: 'background.default',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={isMobile ? 40 : 60} />
            <Typography variant="body1" color="text.secondary">
              Ma'lumotlar yuklanmoqda...
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Refresh />}
              onClick={() => {
                setLoading(true);
                fetchOrders();
              }}
            >
              Qayta yuklash
            </Button>
          </Stack>
        </Box>
      </ThemeProvider>
    );
  }

  const getGridColumns = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 3;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          p: isMobile ? 1 : 3,
          bgcolor: 'background.default',
          minHeight: '100vh',
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: 'primary.light',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: 'white' },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" fontWeight="bold">
              Oshxona Buyurtmalari
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Ovozni yoqish/o'chirish">
              <FormControlLabel
                control={
                  <Switch
                    checked={soundEnabled}
                    onChange={() => setSoundEnabled(prev => !prev)}
                    color="primary"
                    size="small"
                  />
                }
                label={soundEnabled ? 'Ovoz yoqilgan' : 'Ovoz o\'chirilgan'}
                labelPlacement="start"
                sx={{ '& .MuiTypography-root': { fontSize: '0.8rem', color: 'text.secondary' } }}
              />
            </Tooltip>
            <Tooltip title="Yangilash">
              <IconButton
                onClick={() => {
                  setLoading(true);
                  fetchOrders();
                }}
                sx={{
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' },
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <MoreVert />
            </IconButton>
            <Menu
              id="long-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                style: {
                  width: '200px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                },
              }}
            >
              <MenuItem onClick={() => { handleMenuClose(); }}>
                <ListItemIcon>
                  <FilterList fontSize="small" />
                </ListItemIcon>
                Filtrlash
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); }}>
                <ListItemIcon>
                  <Notifications fontSize="small" />
                </ListItemIcon>
                Bildirishnomalar
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>

        {/* Tabs with badges */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 2,
            bgcolor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: isMobile ? 'sticky' : 'static',
            top: isMobile ? 0 : 'auto',
            zIndex: 1000,
          }}
        >
          <Tab
            label={
              <Badge badgeContent={filteredOrders[0].length} color="warning">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AccessTime fontSize="small" />
                  <Typography>Yangi ({filteredOrders[0].length})</Typography>
                </Stack>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={filteredOrders[1].length} color="info">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Timer fontSize="small" />
                  <Typography>Jarayonda ({filteredOrders[1].length})</Typography>
                </Stack>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={filteredOrders[2].length} color="primary">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <DirectionsBike fontSize="small" />
                  <Typography>Yetkazilmoqda ({filteredOrders[2].length})</Typography>
                </Stack>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={filteredOrders[3].length} color="success">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <DoneAll fontSize="small" />
                  <Typography>Yakunlangan ({filteredOrders[3].length})</Typography>
                </Stack>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={filteredOrders[4].length} color="error">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AssignmentReturn fontSize="small" />
                  <Typography>Qaytarildi ({filteredOrders[4].length})</Typography>
                </Stack>
              </Badge>
            }
          />
        </Tabs>

        {/* Orders Grid */}
        <Box id="back-to-top-anchor" sx={{ mb: isMobile ? 16 : 8 }}>
          {filteredOrders[activeTab].length === 0 ? (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Buyurtmalar topilmadi
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Ushbu bo'limda hozircha buyurtmalar mavjud emas.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => {
                  setLoading(true);
                  fetchOrders();
                }}
                sx={{ mt: 2 }}
              >
                Yangilash
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={isMobile ? 1 : isTablet ? 2 : 3}>
              {filteredOrders[activeTab].map(order => (
                <Grid item xs={getGridColumns()} key={order.id}>
                  <Card>
                    <CardContent sx={{ p: isMobile ? 1.5 : 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            #{order.id}
                            {getStatusLabel(order.status, true)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(order.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {calculateTotalPrice(order.items)} so'm
                        </Typography>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5 }}>
                          Mijoz
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2" noWrap>
                            <Person fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {order.user || 'Noma\'lum'}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="a"
                            href={`tel:${order.contact_number}`}
                            sx={{
                              textDecoration: 'none',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' },
                              noWrap: true,
                            }}
                          >
                            <Phone fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {order.contact_number || 'Noma\'lum'}
                          </Typography>
                          <Tooltip title={order.address || 'Manzil kiritilmagan'} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                              {order.address || 'Manzil kiritilmagan'}
                            </Typography>
                          </Tooltip>
                        </Stack>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5 }}>
                          Tafsilotlar
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2" noWrap>
                            <Restaurant fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {order.kitchen?.name || 'Noma\'lum'}
                          </Typography>
                          <Typography variant="body2">
                            <Payment fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {order.payment === 'naqd' ? 'Naqd' : 'Karta orqali'}
                          </Typography>
                          <Typography variant="body2">
                            <Timer fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                            {formatTime(order.kitchen_time)}
                          </Typography>
                        </Stack>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5 }}>
                          Mahsulotlar ({order.items.length})
                        </Typography>
                        <Stack spacing={0.5}>
                          {order.items.slice(0, 3).map((item, index) => (
                            <Typography key={index} variant="body2" noWrap>
                              {item.quantity}x {item.product?.title || 'Noma\'lum'}
                            </Typography>
                          ))}
                          {order.items.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{order.items.length - 3} ta boshqa mahsulot
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        {order.status === 'buyurtma_tushdi' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Timer />}
                            onClick={() => openEditDialog(order)}
                            sx={{ py: 0.8, flex: 1, minHeight: '48px' }}
                          >
                            Vaqt
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Print />}
                          onClick={() => printReceipt(order)}
                          sx={{ py: 0.8, flex: 1, minHeight: '48px' }}
                        >
                          Chop et
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Kitchen Time Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: '16px', p: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Timer color="primary" />
              <Typography>Oshxona vaqtini belgilash</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Buyurtma raqami: <strong>#{currentOrder?.id}</strong>
            </Typography>
            <TextField
              label="Tayyor bo'lish vaqti"
              type="number"
              fullWidth
              value={kitchenMinutes}
              onChange={e => setKitchenMinutes(e.target.value)}
              InputProps={{
                inputProps: { min: 5, max: 180 },
                endAdornment: <InputAdornment position="end">minut</InputAdornment>,
                sx: { borderRadius: '10px' },
              }}
              helperText="Iltimos, 5-180 daqiqa oralig'ida kiriting"
              size="medium"
              sx={{ mt: 1 }}
              autoFocus
            />
            {dialogError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
                {dialogError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditDialogOpen(false)}
              color="primary"
              sx={{ fontWeight: 600 }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateKitchenTime}
              disabled={!kitchenMinutes}
              sx={{ fontWeight: 600, borderRadius: '10px' }}
            >
              Tasdiqlash
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Order Notification */}
        <Snackbar
          open={newOrderCount > 0}
          autoHideDuration={5000}
          onClose={() => setNewOrderCount(0)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="info"
            icon={<Notifications />}
            onClose={() => setNewOrderCount(0)}
            sx={{ width: '100%', borderRadius: '10px' }}
          >
            <Typography fontWeight="bold">{newOrderCount} ta yangi buyurtma!</Typography>
            <Typography>Yangilash uchun tugmani bosing</Typography>
            <Button
              size="small"
              onClick={() => {
                setLoading(true);
                fetchOrders();
                setNewOrderCount(0);
              }}
              sx={{ mt: 1 }}
            >
              Yangilash
            </Button>
          </Alert>
        </Snackbar>

        {/* Error Notification */}
        <Snackbar
          open={!!error}
          autoHideDuration={5000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            onClose={() => setError('')}
            sx={{ width: '100%', borderRadius: '10px' }}
          >
            {error}
          </Alert>
        </Snackbar>

        {/* Success Notification */}
        <Snackbar
          open={!!success}
          autoHideDuration={5000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccess('')}
            sx={{ width: '100%', borderRadius: '10px' }}
          >
            {success}
          </Alert>
        </Snackbar>

        <ScrollTop>
          <Fab color="primary" size="medium" aria-label="scroll back to top">
            <KeyboardArrowUp />
          </Fab>
        </ScrollTop>
      </Box>
    </ThemeProvider>
  );
};

export default KitchenOrders;
 