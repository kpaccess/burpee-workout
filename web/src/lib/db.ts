import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserData, WorkoutLog } from '../types';

export const getUserData = async (userId: string): Promise<UserData | null> => {
  if (!db) return null;
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserData;
  }
  return null;
};

export const saveUserDataDB = async (userId: string, data: Partial<UserData>) => {
  if (!db) return;
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, data, { merge: true });
};

export const logWorkoutDB = async (userId: string, targetDate: string, completed: boolean) => {
  if (!db) return;
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  let logs: WorkoutLog[] = [];
  if (docSnap.exists()) {
    logs = docSnap.data().workoutLogs || [];
  }
  
  // Find and update, or push new
  const index = logs.findIndex(l => l.date === targetDate);
  if (index >= 0) {
    logs[index].completed = completed;
  } else {
    logs.push({ date: targetDate, completed });
  }

  await updateDoc(docRef, { workoutLogs: logs });
  return logs;
};
