import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, CircularProgress, Alert, Stack, Button, Card, CardContent,
  Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  InputAdornment, IconButton, ThemeProvider, createTheme, useMediaQuery,
  Tabs, Tab, FormControlLabel, Switch, Table, TableContainer, TableHead,
  TableBody, TableRow, TableCell, Paper, Avatar, Divider, Badge, Chip,
  Tooltip, Menu, MenuItem, ListItemIcon, Fab, useScrollTrigger, Zoom,
  Grid
} from '@mui/material';
import {
  Refresh, Edit, Timer, ArrowBack, AccessTime, AssignmentReturn, Person,
  Phone, LocationOn, Payment, Restaurant, Assignment, Notifications,
  MoreVert, CheckCircle, Cancel, DirectionsBike, DoneAll, FilterList,
  KeyboardArrowUp
} from '@mui/icons-material';

// Audio file
import newOrderSound from '../assets/notification.mp3';

// API settings
const BASE_URL = 'https://hosilbek.pythonanywhere.com';
const ORDERS_API = `${BASE_URL}/api/user/orders/`;

// Custom theme with modern colors
const theme = createTheme({
  palette: {
    primary: { main: '#4361ee' },
    secondary: { main: '#3f37c9' },
    error: { main: '#f72585' },
    success: { main: '#4cc9f0' },
    warning: { main: '#f8961e' },
    info: { main: '#4895ef' },
    background: { 
      default: '#f8f9fa', 
      paper: '#ffffff' 
    },
    text: { 
      primary: '#212529', 
      secondary: '#6c757d' 
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h5: { 
      fontWeight: 700, 
      fontSize: '1.5rem',
      letterSpacing: '-0.5px'
    },
    subtitle1: { 
      fontWeight: 600, 
      fontSize: '1.1rem',
      letterSpacing: '-0.2px'
    },
    body1: { 
      fontSize: '0.95rem',
      lineHeight: 1.6 
    },
    body2: { 
      fontSize: '0.9rem',
      lineHeight: 1.5 
    },
    caption: { 
      fontSize: '0.85rem',
      color: '#6c757d'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
          },
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontSize: '0.95rem',
          fontWeight: '600',
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        }
      },
    },
    MuiDialog: {
      styleOverrides: { 
        paper: { 
          borderRadius: '16px', 
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        } 
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { 
          textTransform: 'none', 
          fontWeight: '600', 
          fontSize: '0.9rem',
          minHeight: '48px',
          padding: '0 16px',
          minWidth: 'unset'
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { 
          padding: '12px',
          fontSize: '0.9rem',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        },
        head: { 
          fontWeight: 'bold', 
          backgroundColor: '#f8f9fa',
          color: '#212529'
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.75rem'
        }
      }
    }
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

const CourierOrders = () => {
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
  const initializeAudio = () => {
    try {
      const audio = new Audio(newOrderSound);
      audio.volume = 0.5;
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
      }
    };

    const events = ['click', 'touchstart', 'mousedown', 'keydown', 'mousemove'];
    events.forEach(event => window.addEventListener(event, handleInteraction));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleInteraction));
    };
  }, [userInteracted]);

  // Check token and fetch orders
  const fetchOrders = async () => {
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
      const buyurtmaTushdiOrders = ordersData.filter(o => o.status === 'buyurtma_tushdi');

      // Calculate new orders since last fetch
      if (orders.length > 0) {
        const newOrders = buyurtmaTushdiOrders.filter(newOrder => 
          !orders.some(oldOrder => oldOrder.id === newOrder.id)
        );
        setNewOrderCount(newOrders.length);
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
    try {
      await axios.patch(
        `${ORDERS_API}${currentOrder.id}/`,
        { 
          kitchen_time: formattedTime, 
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
    const date = new Date(timestamp);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) + 
           ', ' + date.toLocaleDateString('uz-UZ');
  };

  // Status label with colors
  const getStatusLabel = (status, isChip = false) => {
    const statusMap = {
      buyurtma_tushdi: { label: 'Yangi', color: 'warning' },
      oshxona_vaqt_belgiladi: { label: 'Vaqt belgilandi', color: 'info' },
      kuryer_oldi: { label: 'Kuryer oldi', color: 'primary' },
      qaytarildi: { label: 'Qaytarildi', color: 'error' },
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    
    if (isChip) {
      return (
        <Chip 
          label={statusInfo.label} 
          color={statusInfo.color} 
          size="small" 
          sx={{ fontWeight: 600 }}
        />
      );
    }
    return statusInfo.label;
  };

  // Filter orders by tab
  const filteredOrders = [
    orders.filter(o => o.status === 'buyurtma_tushdi'),
    orders.filter(o => o.status === 'oshxona_vaqt_belgiladi'),
    orders.filter(o => o.status === 'kuryer_oldi'),
    orders.filter(o => o.status === 'qaytarildi')
  ];

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
  }, [token, navigate]);

  // Reset new order count after showing notification
  useEffect(() => {
    if (newOrderCount > 0) {
      const timer = setTimeout(() => setNewOrderCount(0), 5000);
      return () => clearTimeout(timer);
    }
  }, [newOrderCount]);

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        bgcolor: 'background.default' 
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 4;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        p: isMobile ? 2 : 3, 
        bgcolor: 'background.default', 
        minHeight: '100vh',
        maxWidth: 1400,
        mx: 'auto'
      }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: 'white' }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" color="primary" fontWeight="bold">
              Buyurtmalar Boshqaruvi
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
                sx={{ 
                  '& .MuiTypography-root': { 
                    fontSize: '0.8rem',
                    color: 'text.secondary'
                  } 
                }}
              />
            </Tooltip>
            
            <Tooltip title="Yangilash">
              <IconButton 
                onClick={fetchOrders} 
                sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
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
                '&:hover': { bgcolor: 'action.hover' }
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
                  borderRadius: '12px'
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
            mb: 3, 
            bgcolor: 'background.paper', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab 
            label={
              <Badge 
                badgeContent={filteredOrders[0].length} 
                color="warning" 
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10 } }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AccessTime fontSize="small" />
                  <span>Yangi</span>
                </Stack>
              </Badge>
            }
            sx={{ minWidth: 'unset', px: 2 }}
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredOrders[1].length} 
                color="info" 
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10 } }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Timer fontSize="small" />
                  <span>Jarayonda</span>
                </Stack>
              </Badge>
            }
            sx={{ minWidth: 'unset', px: 2 }}
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredOrders[2].length} 
                color="primary" 
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10 } }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <DirectionsBike fontSize="small" />
                  <span>Yetkazilmoqda</span>
                </Stack>
              </Badge>
            }
            sx={{ minWidth: 'unset', px: 2 }}
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredOrders[3].length} 
                color="error" 
                max={99}
                sx={{ '& .MuiBadge-badge': { right: -10 } }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AssignmentReturn fontSize="small" />
                  <span>Yakunlangan</span>
                </Stack>
              </Badge>
            }
            sx={{ minWidth: 'unset', px: 2 }}
          />
        </Tabs>

        {/* Orders Grid */}
        <Box id="back-to-top-anchor">
          {filteredOrders[activeTab].length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '300px',
              textAlign: 'center',
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <img 
                src="/empty-state.svg" 
                alt="No orders" 
                style={{ width: '150px', opacity: 0.7, marginBottom: '20px' }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Buyurtmalar topilmadi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '300px' }}>
                Ushbu bo'limda hozircha buyurtmalar mavjud emas. Yangi buyurtmalar avtomatik ravishda shu yerda ko'rinadi.
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />} 
                onClick={fetchOrders}
                sx={{ mt: 2 }}
              >
                Yangilash
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredOrders[activeTab].map(order => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
                  <Card>
                    <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                      {/* Order Header */}
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

                      <Divider sx={{ my: 1.5, opacity: 0.5 }} />

                      {/* Customer Info */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5 }}>
                          Mijoz
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2" noWrap>
                            <Person fontSize="small" color="action" sx={{ opacity: 0.7, mr: 0.5 }} />
                            {order.user?.name || 'Noma\'lum'}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="a"
                            href={`tel:${order.contact_number}`}
                            sx={{ 
                              textDecoration: 'none', 
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' },
                              noWrap: true
                            }}
                          >
                            <Phone fontSize="small" color="action" sx={{ opacity: 0.7, mr: 0.5 }} />
                            {order.contact_number || 'Noma\'lum'}
                          </Typography>
                          <Tooltip title={order.address || 'Manzil kiritilmagan'} arrow>
                            <Typography variant="body2" noWrap>
                              <LocationOn fontSize="small" color="action" sx={{ opacity: 0.7, mr: 0.5 }} />
                              {order.address || 'Manzil kiritilmagan'}
                            </Typography>
                          </Tooltip>
                        </Stack>
                      </Box>

                      {/* Order Details */}
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 0.5 }}>
                          Tafsilotlar
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2" noWrap>
                            <Restaurant fontSize="small" color="action" sx={{ opacity: 0.7, mr: 0.5 }} />
                            {order.kitchen?.name || 'Noma\'lum'}
                          </Typography>
                          <Typography variant="body2">
                            <Payment fontSize="small" color="action" sx={{ opacity: 0.7, mr: 0.5 }} />
                            {order.payment === 'naqd' ? 'Naqd' : 'Karta orqali'}
                          </Typography>
                          <Typography variant="body2">
                            <Timer fontSize="small" color="action" sx={{ opacity: 0.7, mr: 0.5 }} />
                            {formatTime(order.kitchen_time)}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Products Summary */}
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

                      {/* Action Buttons */}
                      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        {order.status === 'buyurtma_tushdi' && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Timer />}
                            onClick={() => openEditDialog(order)}
                            fullWidth
                            sx={{ py: 0.8 }}
                          >
                            Vaqt
                          </Button>
                        )}
                      
                        
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
        >
          <DialogTitle sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            pb: 2
          }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Timer color="primary" />
              <span>Oshxona vaqtini belgilash</span>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
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
                sx: { borderRadius: '10px' }
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
          <DialogActions sx={{ p: 3, pt: 0, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Button 
              onClick={() => setEditDialogOpen(false)} 
              variant="outlined"
              sx={{ borderRadius: '10px', px: 3 }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateKitchenTime}
              disabled={!kitchenMinutes}
              sx={{ borderRadius: '10px', px: 3 }}
            >
              Tasdiqlash
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Order Notification */}
        <Snackbar
          open={newOrderCount > 0}
          autoHideDuration={6000}
          onClose={() => setNewOrderCount(0)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ '& .MuiPaper-root': { borderRadius: '12px' } }}
        >
          <Alert 
            severity="info" 
            icon={<Notifications fontSize="large" />}
            onClose={() => setNewOrderCount(0)}
            sx={{ 
              bgcolor: 'background.paper',
              color: 'text.primary',
              alignItems: 'center',
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {newOrderCount} ta yangi buyurtma!
            </Typography>
            <Typography variant="body2">
              Yangi buyurtmalarni ko'rish uchun yangilash tugmasini bosing
            </Typography>
          </Alert>
        </Snackbar>

        {/* Error Notification */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            onClose={() => setError('')}
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              alignItems: 'center'
            }}
          >
            {error}
          </Alert>
        </Snackbar>

        {/* Success Notification */}
        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity="success" 
            onClose={() => setSuccess('')}
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              alignItems: 'center'
            }}
          >
            {success}
          </Alert>
        </Snackbar>

        {/* Scroll to top button */}
        <ScrollTop>
          <Fab color="primary" size="medium" aria-label="scroll back to top">
            <KeyboardArrowUp />
          </Fab>
        </ScrollTop>
      </Box>
    </ThemeProvider>
  );
};

export default CourierOrders;