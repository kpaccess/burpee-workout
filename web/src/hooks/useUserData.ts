import { useState, useEffect } from 'react';
import { UserData } from '../types';
import { useAuth } from '../context/AuthContext';
import { getUserData, saveUserDataDB } from '../lib/db';
import { toDateKey } from '../lib/date';

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null | undefined>(undefined);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFirebaseData() {
      if (!user) {
        setUserData(null);
        setSyncError(null);
        return;
      }

      // Mark as loading for authenticated users while Firestore fetch runs.
      setUserData(undefined);
      
      try {
        const data = await getUserData(user.uid);
        if (mounted) {
          setUserData(data || null);
          setSyncError(null);
        }
      } catch (err) {
        console.error('Failed to load user data from Firebase', err);
        if (mounted) {
          // Keep undefined so UI doesn't look like a first-time user.
          setUserData(undefined);
          setSyncError('Failed to load your data from Firebase.');
        }
      }
    }

    loadFirebaseData();
    
    return () => { mounted = false; };
  }, [user]);

  const saveUserData = async (data: Partial<UserData>) => {
    if (!user) return;
    const baseData = (userData ?? {}) as Partial<UserData>;
    const newData = { ...baseData, ...data } as UserData;
    setUserData(newData); // Optimistic UI update
    try {
      await saveUserDataDB(user.uid, newData);
      setSyncError(null);
    } catch (err) {
      console.error('Failed to save user data to Firebase', err);
      setSyncError('Failed to sync data. Please check your login and try again.');
      throw err;
    }
  };

  const toggleWorkoutLog = async (dateStr: string, completed: boolean) => {
    if (!user || !userData) return;
    const normalizedDate = toDateKey(dateStr);
    const logs = [...(userData.workoutLogs || [])];
    const idx = logs.findIndex(l => toDateKey(l.date) === normalizedDate);
    const levelCompleted = completed ? (userData.currentLevelId || undefined) : undefined;
    
    if (idx >= 0) {
      logs[idx].completed = completed;
      logs[idx].date = normalizedDate;
      logs[idx].levelCompleted = levelCompleted;
    } else {
      logs.push({ date: normalizedDate, completed, levelCompleted });
    }
    
    await saveUserData({ workoutLogs: logs });
  };

  const clearUserData = () => {
    setUserData(null);
    // Real implementation would delete from DB here or let the AuthContext handle logout
  };

  const isLoaded = !user || userData !== undefined || !!syncError;

  return { userData, isLoaded, saveUserData, clearUserData, toggleWorkoutLog, syncError };
}
