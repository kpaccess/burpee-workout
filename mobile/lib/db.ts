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

// Advanced N and C workouts both include pushups. No-pushup C logs are only
// created by the tier-aware save paths for beginner workouts.
const WORKOUT_TYPE_MAP = {
  N: 'with_pushups',
  C: 'with_pushups',
} as const satisfies Record<string, WorkoutLog['workoutType']>;

export const logWorkoutDB = async (userId: string, targetDate: string, completed: boolean, type?: 'N' | 'C') => {
  if (!db) return;
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);

  let logs: WorkoutLog[] = [];
  if (docSnap.exists()) {
    logs = docSnap.data().workoutLogs || [];
  }

  const workoutType = type ? WORKOUT_TYPE_MAP[type] : undefined;

  // Find and update, or push new
  const index = logs.findIndex(l => l.date === targetDate);
  if (index >= 0) {
    logs[index].completed = completed;
    if (completed) logs[index].workoutType = workoutType;
    else delete logs[index].workoutType;
  } else if (completed) {
    logs.push({ date: targetDate, completed, workoutType });
  }

  await updateDoc(docRef, { workoutLogs: logs });
  return logs;
};
