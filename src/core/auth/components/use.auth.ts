import { useContext } from 'react';

import { AuthContext } from './auth.context';

/** Zugriff auf Auth-Zustand und -Aktionen aus dem `AuthProvider`. */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
