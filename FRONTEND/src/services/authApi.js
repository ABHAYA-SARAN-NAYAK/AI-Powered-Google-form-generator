import { formGeneratorApi } from './formGeneratorApi';

// Absolute backend URL for OAuth redirects. In dev this is '/api' (Vite proxy),
// in production it is the deployed backend URL via VITE_API_BASE_URL.
const authBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export function beginGoogleLogin() {
  window.location.assign(`${authBaseUrl}/auth/google`);
}

export async function getMe() {
  // Use proxied base URL; requests go to '/api/me' in dev via proxy
  const { data } = await formGeneratorApi.get('/me');
  return data;
}

export async function logout() {
  const { data } = await formGeneratorApi.post('/logout');
  return data;
}
