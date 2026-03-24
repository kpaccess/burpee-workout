import { useState, useEffect } from 'react';
import { UserData } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserData, saveUserDataDB } from '../lib/db';
import { toDateKey } from '../lib/date';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoaded(false); // Reset while fetching so we show loading instead of Onboarding

    async function loadFirebaseData() {
      if (!user) {
        setUserData(null);
        setIsLoaded(true);
        return;
      }
      
      try {
        const data = await getUserData(user.uid);
        if (mounted) {
          setUserData(data || null);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load user data from Firebase', err);
        if (mounted) setIsLoaded(true);
      }
    }

    loadFirebaseData();
    
    return () => { mounted = false; };
  }, [user]);

  const saveUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    const newData = { ...userData, ...data } as UserData;
    setUserData(newData); // Optimistic UI update
    await saveUserDataDB(user.uid, newData);
  };

  const toggleWorkoutLog = async (dateStr: string, completed: boolean) => {
    if (!user || !userData) return;
    const normalizedDate = toDateKey(dateStr);
    const logs = [...(userData.workoutLogs || [])];
    const idx = logs.findIndex(l => toDateKey(l.date) === normalizedDate);
    
    if (idx >= 0) {
      logs[idx].completed = completed;
      logs[idx].date = normalizedDate;
    } else {
      logs.push({ date: normalizedDate, completed });
    }
    
    await saveUserData({ workoutLogs: logs });
  };

  const clearUserData = () => {
    setUserData(null);
    // Real implementation would delete from DB here or let the AuthContext handle logout
  };

  return { userData, isLoaded, saveUserData, clearUserData, toggleWorkoutLog };
}
