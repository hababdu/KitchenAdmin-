import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Button, TextField, Typography, Container, Card, CardContent, Avatar,
  Snackbar, Alert, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Grid, Paper, Divider, IconButton, CircularProgress, FormHelperText, Dialog,
  DialogTitle, DialogContent, DialogActions, Fade
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Fastfood as FastfoodIcon,
  Kitchen as KitchenIcon,
  Category as CategoryIcon,
  AttachMoney as PriceIcon,
  Discount as DiscountIcon,
  UploadFile as UploadIcon,
  Scale as ScaleIcon,
  Add as AddIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  ArrowBackIos as ArrowBackIosIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// MUI theme
const theme = createTheme({
  palette: {
    primary: { main: '#3366ff' },
    secondary: { main: '#ff3d71' },
    success: { main: '#00d68f' },
    background: { default: '#f7f9fc' },
    error: { main: '#ff1744' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.75rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    body2: { fontSize: '0.875rem', color: 'text.secondary' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

const AddProductPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    kitchen_id: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    discount: '0.00',
    unit: 'gram',
  });
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubcategoriesLoading, setIsSubcategoriesLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);

  const unitOptions = ['gram', 'liter', 'dona', 'kg', 'ml', 'portion'];

  // Get auth header
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Autentifikatsiya tokeni topilmadi');
    }
    return { Authorization: `Bearer ${token}` };
  }, []);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setIsSubcategoriesLoading(true);
    setError('');
    
    try {
      const headers = getAuthHeader();
      const [kitchensRes, categoriesRes, subcategoriesRes] = await Promise.all([
        axios.get('https://hosilbek.pythonanywhere.com/api/user/kitchens/', { headers }),
        axios.get('https://hosilbek.pythonanywhere.com/api/user/categories/', { headers }),
        axios.get('https://hosilbek.pythonanywhere.com/api/user/subcategories/', { headers }),
      ]);

      console.log('Kitchens API response:', kitchensRes.data);
      console.log('Categories API response:', categoriesRes.data);
      console.log('Subcategories API response:', subcategoriesRes.data);

      if (!Array.isArray(kitchensRes.data)) throw new Error('Oshxonalar ro‘yxati massiv emas');
      if (!Array.isArray(categoriesRes.data)) throw new Error('Kategoriyalar ro‘yxati massiv emas');
      if (!Array.isArray(subcategoriesRes.data)) throw new Error('Subkategoriyalar ro‘yxati massiv emas');

      setKitchens(kitchensRes.data);
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);

      if (kitchensRes.data.length > 0) {
        setFormData(prev => ({ ...prev, kitchen_id: kitchensRes.data[0].id }));
      }
      if (categoriesRes.data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: categoriesRes.data[0].id }));
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
      setIsSubcategoriesLoading(false);
    }
  }, [getAuthHeader, formData.category_id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Update subcategory_id when category_id changes
  const filteredSubcategories = useMemo(() => {
    return subcategories.filter(
      sub => sub.category && sub.category.id === Number(formData.category_id)
    );
  }, [formData.category_id, subcategories]);

  useEffect(() => {
    if (!formData.category_id) return;
    setFormData(prev => ({ ...prev, subcategory_id: '' }));
    if (filteredSubcategories.length > 0) {
      setFormData(prev => ({ ...prev, subcategory_id: filteredSubcategories[0].id }));
    }
  }, [formData.category_id, filteredSubcategories]);

  // Handle API errors
  const handleApiError = (error) => {
    if (error.response) {
      const errorDetail = error.response.data;
      switch (error.response.status) {
        case 401:
          setError('Sessiya tugadi. Iltimos, qayta kiring.');
          navigate('/login');
          break;
        case 400:
          if (typeof errorDetail === 'object') {
            const errors = Object.values(errorDetail).flat().join(', ');
            setError(`Noto‘g‘ri ma’lumot: ${errors || 'Iltimos, kiritilgan ma’lumotlarni tekshiring'}`);
          } else {
            setError(`Noto‘g‘ri ma’lumot: ${errorDetail || 'Iltimos, kiritilgan ma’lumotlarni tekshiring'}`);
          }
          break;
        case 500:
          setError('Server xatosi. Iltimos, keyinroq qayta urinib ko‘ring.');
          break;
        default:
          setError(error.response.data.message || 'Xato yuz berdi');
      }
    } else if (error.message === 'Autentifikatsiya tokeni topilmadi') {
      setError('Iltimos, tizimga kiring');
      navigate('/login');
    } else {
      setError(error.message || 'Kutilmagan xato yuz berdi');
    }
    console.error('API xatosi:', error.response?.data || error);
  };

  // Handle photo preview
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Mahsulot nomi kiritilishi shart';
    if (!formData.description.trim()) newErrors.description = 'Tavsif kiritilishi shart';
    if (!formData.kitchen_id) newErrors.kitchen_id = 'Oshxona tanlanishi shart';
    if (!formData.category_id) newErrors.category_id = 'Kategoriya tanlanishi shart';
    if (!formData.subcategory_id) newErrors.subcategory_id = 'Subkategoriya tanlanishi shart';
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'To‘g‘ri narx kiriting';
    }
    if (!photo) newErrors.photo = 'Rasm yuklanishi shart';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Faqat JPG yoki PNG rasm formatlari qabul qilinadi');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Rasm hajmi 5MB dan kichik bo‘lishi kerak');
      return;
    }

    setPhoto(file);
    setErrors(prev => ({ ...prev, photo: '' }));
    setError('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = theme.palette.action.hover;
  };

  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = theme.palette.background.paper;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = theme.palette.background.paper;
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange({ target: { files: [file] } });
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setErrors(prev => ({ ...prev, photo: 'Rasm yuklanishi shart' }));
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Kategoriya nomi kiritilishi shart');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const headers = getAuthHeader();
      const response = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/user/categories/',
        { name: newCategoryName.trim() },
        { headers }
      );

      setCategories(prev => [...prev, response.data]);
      setFormData(prev => ({ ...prev, category_id: response.data.id }));
      setNewCategoryName('');
      setSuccess('Kategoriya muvaffaqiyatli qo‘shildi!');
      setCategoryModalOpen(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new subcategory
  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      setError('Subkategoriya nomi kiritilishi shart');
      return;
    }
    if (!formData.category_id || isNaN(Number(formData.category_id))) {
      setError('Iltimos, to‘g‘ri kategoriyani tanlang');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const headers = getAuthHeader();
      const payload = {
        name: newSubcategoryName.trim(),
        category_id: Number(formData.category_id),
      };
      console.log('Subcategory POST payload:', payload);

      const response = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/user/subcategories/',
        payload,
        { headers }
      );

      console.log('Subcategory API response:', response.data);

      setSubcategories(prev => [...prev, response.data]);
      setFormData(prev => ({ ...prev, subcategory_id: response.data.id }));
      setNewSubcategoryName('');
      setSuccess('Subkategoriya muvaffaqiyatli qo‘shildi!');
      setSubcategoryModalOpen(false);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      };

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('photo', photo);

      const response = await axios.post(
        'https://hosilbek.pythonanywhere.com/api/user/products/',
        formDataToSend,
        { headers }
      );

      setSuccess('Mahsulot muvaffaqiyatli qo‘shildi!');
      setFormData({
        title: '',
        description: '',
        kitchen_id: formData.kitchen_id,
        category_id: formData.category_id,
        subcategory_id: '',
        price: '',
        discount: '0.00',
        unit: 'gram',
      });
      setPhoto(null);
      setErrors({});
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}>
        {/* Sarlavha qismi */}
        <Box sx={{
          bgcolor: 'primary.main',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <IconButton 
            color="inherit" 
            onClick={() => navigate(-1)}
            sx={{ '&:hover': { bgcolor: 'primary.dark' } }}
            aria-label="Orqaga qaytish"
          >
            <ArrowBackIosIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" fontWeight="medium">
            Yangi Mahsulot Qo‘shish
          </Typography>
        </Box>

        {/* Asosiy kontent */}
        <Box sx={{
          flex: 1,
          overflowY: 'auto',
          p: { xs: 2, sm: 3 },
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.light', borderRadius: 2 },
        }}>
          <Container maxWidth="md">
            {/* Rasm yuklash */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
                >
                  <ImageIcon color="primary" sx={{ mr: 1 }} />
                  Mahsulot Rasmi
                </Typography>
                
                <Box
                  sx={{
                    height: 200,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: errors.photo ? 'error.main' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  {photoPreview ? (
                    <>
                      <img
                        src={photoPreview}
                        alt="Mahsulot rasmi"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto();
                        }}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                        }}
                        aria-label="Rasmni o‘chirish"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <Box sx={{ 
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}>
                      <CloudUploadIcon fontSize="large" sx={{ mb: 1 }} />
                      <Typography variant="body2">
                        Rasmni bu yerga tashlang yoki yuklash uchun bosing
                      </Typography>
                      <Typography variant="caption" sx={{ mt: 0.5 }}>
                        PNG yoki JPEG, maks. 5MB
                      </Typography>
                    </Box>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    onChange={handleFileChange}
                    aria-describedby={errors.photo ? 'photo-error' : undefined}
                  />
                </Box>
                {errors.photo && (
                  <FormHelperText error sx={{ mt: 1 }}>
                    {errors.photo}
                  </FormHelperText>
                )}
              </CardContent>
            </Card>

            {/* Asosiy ma'lumotlar */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
                >
                  <InfoIcon color="primary" sx={{ mr: 1 }} />
                  Asosiy Ma‘lumotlar
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Mahsulot nomi"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      error={!!errors.title}
                      helperText={errors.title}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FastfoodIcon color="primary" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 1 }}
                      aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tavsif"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      error={!!errors.description}
                      helperText={errors.description}
                      sx={{ mb: 1 }}
                      aria-describedby={errors.description ? 'description-error' : undefined}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Narx (so‘m)"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      type="number"
                      required
                      error={!!errors.price}
                      helperText={errors.price}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PriceIcon color="primary" fontSize="small" />
                          </InputAdornment>
                        ),
                        inputProps: { min: 0, step: '1000' },
                      }}
                      aria-describedby={errors.price ? 'price-error' : undefined}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Chegirma (so‘m)"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DiscountIcon color="primary" fontSize="small" />
                          </InputAdornment>
                        ),
                        inputProps: { min: 0, step: '1000' },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={!!errors.unit}>
                      <InputLabel>O‘lchov birligi</InputLabel>
                      <Select
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        label="O‘lchov birligi"
                        required
                        aria-describedby={errors.unit ? 'unit-error' : undefined}
                      >
                        {unitOptions.map(unit => (
                          <MenuItem key={unit} value={unit}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <ScaleIcon fontSize="small" />
                              {unit}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.unit && <FormHelperText>{errors.unit}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={!!errors.kitchen_id}>
                      <InputLabel>Oshxona</InputLabel>
                      <Select
                        name="kitchen_id"
                        value={formData.kitchen_id}
                        onChange={handleChange}
                        label="Oshxona"
                        required
                        disabled={isLoading}
                        aria-describedby={errors.kitchen_id ? 'kitchen_id-error' : undefined}
                      >
                        {kitchens.map(kitchen => (
                          <MenuItem key={kitchen.id} value={kitchen.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <KitchenIcon fontSize="small" />
                              {kitchen.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.kitchen_id && <FormHelperText>{errors.kitchen_id}</FormHelperText>}
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Kategoriyalar */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
                >
                  <CategoryIcon color="primary" sx={{ mr: 1 }} />
                  Kategoriyalar
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={!!errors.category_id}>
                      <InputLabel>Kategoriya</InputLabel>
                      <Select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        label="Kategoriya"
                        required
                        disabled={isLoading}
                        aria-describedby={errors.category_id ? 'category_id-error' : undefined}
                      >
                        {categories.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CategoryIcon fontSize="small" />
                              {category.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.category_id && <FormHelperText>{errors.category_id}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" error={!!errors.subcategory_id}>
                      <InputLabel>Subkategoriya</InputLabel>
                      <Select
                        name="subcategory_id"
                        value={formData.subcategory_id}
                        onChange={handleChange}
                        label="Subkategoriya"
                        required
                        disabled={!formData.category_id || isSubcategoriesLoading}
                        aria-describedby={errors.subcategory_id ? 'subcategory_id-error' : undefined}
                      >
                        {filteredSubcategories.length > 0 ? (
                          filteredSubcategories.map(subcategory => (
                            <MenuItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>Subkategoriyalar mavjud emas</MenuItem>
                        )}
                      </Select>
                      {errors.subcategory_id && <FormHelperText>{errors.subcategory_id}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setCategoryModalOpen(true)}
                        disabled={isLoading}
                        sx={{ flex: 1 }}
                      >
                        Yangi Kategoriya
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setSubcategoryModalOpen(true)}
                        disabled={!formData.category_id || isLoading}
                        sx={{ flex: 1 }}
                      >
                        Yangi Subkategoriya
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Container>
        </Box>

        {/* Saqlash tugmasi */}
        <Box sx={{ 
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              py: 1.5,
              borderRadius: 8,
              fontWeight: 'medium',
              fontSize: '1rem',
              transition: 'all 0.2s',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
            aria-label="Mahsulotni saqlash"
          >
            {isLoading ? 'Saqlanmoqda...' : 'Mahsulotni Saqlash'}
          </Button>
        </Box>

        {/* Yangi kategoriya modali */}
        <Dialog
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          TransitionComponent={Fade}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Yangi Kategoriya Qo‘shish</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              size="small"
              label="Kategoriya nomi"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              sx={{ mt: 1 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoryModalOpen(false)} color="inherit">
              Bekor qilish
            </Button>
            <Button
              onClick={handleAddCategory}
              variant="contained"
              disabled={!newCategoryName.trim() || isLoading}
            >
              Qo‘shish
            </Button>
          </DialogActions>
        </Dialog>

        {/* Yangi subkategoriya modali */}
        <Dialog
          open={subcategoryModalOpen}
          onClose={() => setSubcategoryModalOpen(false)}
          TransitionComponent={Fade}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Yangi Subkategoriya Qo‘shish</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              size="small"
              label="Subkategoriya nomi"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              sx={{ mt: 1 }}
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubcategoryModalOpen(false)} color="inherit">
              Bekor qilish
            </Button>
            <Button
              onClick={handleAddSubcategory}
              variant="contained"
              disabled={!newSubcategoryName.trim() || isLoading}
            >
              Qo‘shish
            </Button>
          </DialogActions>
        </Dialog>

        {/* Xabarlar uchun snackbar */}
        <Snackbar
          open={!!error || !!success}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={Fade}
        >
          <Alert 
            onClose={handleCloseSnackbar}
            severity={error ? 'error' : 'success'}
            sx={{ 
              width: '100%',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontWeight: 500,
            }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default AddProductPage;