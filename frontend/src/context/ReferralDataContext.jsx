import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, getToken } from '../utils/apiClient';

const ReferralDataContext = createContext(null);

export function ReferralDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!getToken()) {
        setError({ code: 'NO_TOKEN', message: 'Sign in to see your referral stats.' });
        setData(null);
        return;
      }
      const dashboard = await api.getDashboard();
      setData(dashboard);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ code: err.code, message: err.message });
      } else {
        setError({ code: 'NETWORK_ERROR', message: 'Could not reach the server. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ReferralDataContext.Provider value={{ data, loading, error, refetch: load }}>
      {children}
    </ReferralDataContext.Provider>
  );
}

export function useReferralData() {
  const ctx = useContext(ReferralDataContext);
  if (!ctx) {
    throw new Error('useReferralData must be used within a ReferralDataProvider');
  }
  return ctx;
}
