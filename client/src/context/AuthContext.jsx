import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Reset inactivity timer on user action (15-min auto lockout)
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (accessToken) {
        console.warn('Session expired due to 15 minutes of inactivity.');
        logout();
      }
    }, 15 * 60 * 1000);
  };

  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach(e => window.addEventListener(e, handleActivity));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [accessToken]);

  // Fetch current user on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 401) {
          // Attempt refresh
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setAccessToken(refreshData.accessToken);
            localStorage.setItem('access_token', refreshData.accessToken);
            // Retry fetchMe
            const retryRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${refreshData.accessToken}` }
            });
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setUser(retryData.user);
            }
          } else {
            logout();
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [accessToken]);

  const login = async (email, password, mfaToken) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mfaToken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    if (data.mfaRequired) {
      return { mfaRequired: true, userId: data.userId };
    }

    setAccessToken(data.accessToken);
    localStorage.setItem('access_token', data.accessToken);
    setUser(data.user);
    return { success: true, user: data.user };
  };

  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setAccessToken(data.accessToken);
    localStorage.setItem('access_token', data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
  };

  // Authenticated fetch wrapper
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`
    };

    let res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      // Try refresh
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);
        localStorage.setItem('access_token', refreshData.accessToken);
        headers.Authorization = `Bearer ${refreshData.accessToken}`;
        res = await fetch(url, { ...options, headers });
      } else {
        logout();
      }
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
