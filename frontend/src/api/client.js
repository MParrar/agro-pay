import axios from 'axios';

export const TOKEN_KEY = 'agropay_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Lets AuthContext react to expired sessions
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.endsWith('/login');
    if (error.response?.status === 401 && !isLogin) onUnauthorized();
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado.') {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.request && !error.response) return 'No se pudo conectar con el servidor.';
  return fallback;
}
