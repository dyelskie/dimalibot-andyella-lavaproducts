import axios from "axios";
 
const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: API_URL });
 
export const saveTokens = (t) => {
  localStorage.setItem("access_token", t.access_token);
  localStorage.setItem("refresh_token", t.refresh_token);
};
export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};
 
// Attach the access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
// If the access token expired (15 min), refresh once and retry
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const refresh_token = localStorage.getItem("refresh_token");
 
    if (
      err.response?.status === 401 &&
      !original._retry &&
      refresh_token &&
      !/\/api\/auth\/(login|register|refresh)/.test(original.url)
    ) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios
            .post(`${API_URL}/api/auth/refresh`, { refresh_token })
            .finally(() => (refreshing = null));
        const { data } = await refreshing;
        saveTokens(data.tokens);
        original.headers.Authorization = `Bearer ${data.tokens.access_token}`;
        return api(original);
      } catch {
        clearTokens();
        window.location.reload();
      }
    }
    return Promise.reject(err);
  }
);
 
export default api;
