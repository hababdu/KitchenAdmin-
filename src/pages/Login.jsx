import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'https://hosilbek02.pythonanywhere.com/api/user/kitchen-login/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Iltimos, foydalanuvchi nomi va parolni kiriting');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Login so‘rovi yuborilmoqda:', {
        username: formData.username,
        password: formData.password,
      });

      const response = await axios.get(API_URL, {
        params: {
          username: formData.username,
          password: formData.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Login API javobi:', JSON.stringify(response.data, null, 2));

      let token, profile;
      if (response.data.token) {
        ({ token, profile } = response.data);
      } else if (response.data.auth_token) {
        token = response.data.auth_token;
        profile = response.data.profile || {};
      } else {
        throw new Error('Serverdan token olinmadi');
      }

      if (!token) {
        throw new Error('Token mavjud emas');
      }

      // Save to localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('userProfile', JSON.stringify(profile || {}));

      // Determine roles based on API response
      const roles = [];
      if (profile?.roles?.is_courier) roles.push('courier');
      if (profile?.roles?.is_kitchen_admin) roles.push('kitchen_admin');
      if (profile?.roles?.is_superuser) roles.push('superadmin');
      if (roles.length === 0) roles.push('user'); // Fallback
      localStorage.setItem('roles', JSON.stringify(roles));
      console.log('Saqlangan localStorage:', {
        authToken: localStorage.getItem('authToken'),
        userProfile: localStorage.getItem('userProfile'),
        roles: localStorage.getItem('roles'),
      });

      if (onLogin) {
        onLogin();
      }

      // Navigate based on role
      const targetRoute = roles.includes('kitchen_admin') ? '/profile' : '/profile';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      console.error('Login xatosi:', err.response?.data || err.message);
      let errorMessage = 'Kirish muvaffaqiyatsiz. Hisob ma’lumotlarini tekshiring.';
      if (err.response) {
        const { status, data } = err.response;
        if (status === 400) {
          errorMessage = data.detail || 'Noto‘g‘ri ma’lumotlar kiritildi';
        } else if (status === 401) {
          errorMessage = 'Noto‘g‘ri foydalanuvchi nomi yoki parol';
        } else if (status === 403) {
          errorMessage = data.detail || 'Siz kuryer yoki oshxona admini sifatida ro‘yxatdan o‘tmagansiz';
        } else if (status === 404) {
          errorMessage = 'API topilmadi';
        } else {
          errorMessage = 'Server bilan aloqa xatosi';
        }
      } else if (err.request) {
        errorMessage = 'Internet aloqasi yo‘q';
      } else {
        errorMessage = err.message || 'Noma’lum xato';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Tizimga kirish</h2>
          <p className="mt-2 text-sm text-gray-600">
            Hisobingizga kirish uchun ma’lumotlarni kiriting
          </p>
        </div>
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Foydalanuvchi nomi
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.username}
                  onChange={handleChange}
                  aria-describedby={error ? 'username-error' : undefined}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Parol
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.password}
                  onChange={handleChange}
                  aria-describedby={error ? 'password-error' : undefined}
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Kirish...
                  </div>
                ) : (
                  'Kirish'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;