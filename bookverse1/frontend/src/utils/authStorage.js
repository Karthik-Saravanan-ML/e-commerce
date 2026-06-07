const TOKEN_KEY = 'bv_token';

/** Per-tab session token (new tabs start logged out). */
export const getToken = () => {
  const session = sessionStorage.getItem(TOKEN_KEY);
  if (session) return session;
  // One-time migration from older localStorage sessions
  const legacy = localStorage.getItem(TOKEN_KEY);
  if (legacy) {
    sessionStorage.setItem(TOKEN_KEY, legacy);
    localStorage.removeItem(TOKEN_KEY);
    return legacy;
  }
  return null;
};

export const setToken = (token) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
};

export const removeToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
};
