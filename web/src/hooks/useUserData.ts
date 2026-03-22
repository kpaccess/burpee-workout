import { useState, useEffect } from 'react';
import { UserData } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserData, saveUserDataDB } from '../lib/db';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    
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
    const logs = [...(userData.workoutLogs || [])];
    const idx = logs.findIndex(l => l.date === dateStr);
    
    if (idx >= 0) {
      logs[idx].completed = completed;
    } else {
      logs.push({ date: dateStr, completed });
    }
    
    await saveUserData({ workoutLogs: logs });
  };

  const clearUserData = () => {
    setUserData(null);
    // Real implementation would delete from DB here or let the AuthContext handle logout
  };

  return { userData, isLoaded, saveUserData, clearUserData, toggleWorkoutLog };
}
