import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Typography,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
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

const ProductsTable = ({ kitchenId }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [togglingProducts, setTogglingProducts] = useState({});
  const API_URL = 'https://hosilbek.pythonanywhere.com/';
  const token = localStorage.getItem('authToken');

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '', // Use `Bearer` (or change to `Token ${token}` if required)
      'Content-Type': 'application/json',
    },
  });

  // Token refresh function (adjust endpoint and logic based on your backend)
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available');
      const response = await axios.post(`${API_URL}api/token/refresh/`, { refresh: refreshToken });
      const newToken = response.data.access;
      localStorage.setItem('authToken', newToken);
      axiosInstance.defaults.headers.Authorization = `Bearer ${newToken}`;
      console.log('Token refreshed:', newToken);
      return newToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return null;
    }
  };

  // Fetch products for a specific kitchen
  const fetchProducts = useCallback(async (retry = true) => {
    if (!token) {
      setError('Foydalanuvchi tizimga kirmagan');
      setLoading(false);
      window.location.href = '/login';
      return;
    }
    if (!kitchenId) {
      setError('Oshxona ID si topilmadi');
      setLoading(false);
      return;
    }
    console.log('Fetching products with token:', token);
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.get(`api/user/kitchen-products/${kitchenId}/`);
      setProducts(Array.isArray(data) ? data : []);
      console.log('Mahsulotlar yuklandi:', data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      let errorMessage = 'Mahsulotlarni yuklab bo‘lmadi';
      if (err.response?.status === 401) {
        errorMessage = 'Autentifikatsiya xatosi: Iltimos, qayta tizimga kiring.';
        if (retry) {
          const newToken = await refreshToken();
          if (newToken) {
            return fetchProducts(false); // Retry with new token
          }
        }
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      } else if (err.response?.status === 404) {
        errorMessage = `Oshxona (ID: ${kitchenId}) uchun mahsulotlar topilmadi.`;
      } else {
        errorMessage = err.response?.data?.error || err.response?.data?.detail || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, kitchenId]);

  // Toggle product is_aktiv status
  const handleToggleActive = useCallback(
    async (productId, isActive) => {
      if (!token) {
        setSnackbar({ open: true, message: 'Foydalanuvchi tizimga kirmagan', severity: 'error' });
        window.location.href = '/login';
        return;
      }
      if (!kitchenId) {
        setSnackbar({ open: true, message: 'Oshxona ID si topilmadi', severity: 'error' });
        return;
      }
      try {
        setTogglingProducts((prev) => ({ ...prev, [productId]: true }));
        const newIsActive = !isActive;
        console.log(`Toggling product ${productId} in kitchen ${kitchenId} to is_aktiv: ${newIsActive}`);
        const response = await axiosInstance.patch(`api/user/kitchen-products/${kitchenId}/${productId}/`, {
          is_aktiv: newIsActive,
        });
        setProducts((prev) =>
          prev.map((product) =>
            product.id === productId ? { ...product, is_aktiv: newIsActive } : product
          )
        );
        setSnackbar({
          open: true,
          message: `Mahsulot ${newIsActive ? 'faollashtirildi' : 'noaktiv qilindi'}!`,
          severity: 'success',
        });
      } catch (err) {
        console.error('Toggle error:', err.response?.data || err.message);
        let errorMessage = 'Holatni o‘zgartirishda xatolik';
        if (err.response?.status === 401) {
          errorMessage = 'Autentifikatsiya xatosi: Iltimos, qayta tizimga kiring.';
          const newToken = await refreshToken();
          if (newToken) {
            return handleToggleActive(productId, isActive); // Retry
          }
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        } else if (err.response?.status === 404) {
          errorMessage = `Mahsulot (ID: ${productId}) oshxonada (ID: ${kitchenId}) topilmadi.`;
        } else if (err.response?.status === 400) {
          errorMessage = err.response?.data?.error || 'Noto‘g‘ri so‘rov ma‘lumotlari';
        } else {
          errorMessage = err.response?.data?.error || err.response?.data?.detail || errorMessage;
        }
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      } finally {
        setTogglingProducts((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [token, kitchenId]
  );

  // Filter products based on search query
  const filterProducts = useCallback(() => {
    if (!searchQuery) return products;
    return products.filter((product) =>
      product.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Fetch products on mount or when kitchenId changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Close Snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Render: No token
  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
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

  // Render: No kitchenId
  if (!kitchenId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Alert severity="error">Oshxona ID si topilmadi!</Alert>
      </Box>
    );
  }

  // Render: Loading
  if (loading && !products.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography ml={2}>Mahsulotlar yuklanmoqda...</Typography>
      </Box>
    );
  }

  // Render: Error
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => fetchProducts()}>
              Qayta urinish
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Render: Main UI
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', mb: 8 }}>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <Container maxWidth="lg" disableGutters>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Mahsulotlarni qidirish"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="small"
                  sx={{ minWidth: { xs: '150px', sm: '250px' } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={fetchProducts}
                  disabled={loading}
                >
                  Yangilash
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nomi</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Narx (so‘m)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Faol</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterProducts().map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>{product.title || 'Noma\'lum'}</TableCell>
                      <TableCell>{parseFloat(product.price || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip
                          title={togglingProducts[product.id] ? 'Yuklanmoqda...' : product.is_aktiv ? 'Noaktiv qilish' : 'Faollashtirish'}
                          arrow
                        >
                          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <Switch
                              checked={product.is_aktiv || false}
                              onChange={() => handleToggleActive(product.id, product.is_aktiv)}
                              color="primary"
                              disabled={loading || togglingProducts[product.id]}
                              aria-label={`Mahsulotni ${product.is_aktiv ? 'noaktiv qilish' : 'faollashtirish'}`}
                              sx={{
                                transform: 'scale(1.2)',
                                transition: 'transform 0.2s ease, background-color 0.2s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(51, 102, 255, 0.1)',
                                  transform: 'scale(1.3)',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: 'primary.main',
                                },
                                '& .MuiSwitch-switchBase.Mui-disabled': {
                                  opacity: 0.5,
                                },
                                '& .MuiSwitch-track': {
                                  backgroundColor: product.is_aktiv ? 'primary.main' : 'grey.400',
                                  opacity: 0.7,
                                },
                              }}
                            />
                            {togglingProducts[product.id] && (
                              <CircularProgress
                                size={20}
                                sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                              />
                            )}
                          </Box>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {filterProducts().length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <Alert severity="info">
                  {searchQuery ? 'Qidiruv bo‘yicha mahsulotlar topilmadi.' : 'Mahsulotlar topilmadi.'}
                </Alert>
              </Box>
            )}
          </Container>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default ProductsTable;