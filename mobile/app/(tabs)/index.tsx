import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { differenceInDays, addMonths, isAfter } from 'date-fns';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { getUserData, saveUserDataDB } from '../../lib/db';
import { UserData, LEVELS } from '../../types';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Forms
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Onboarding Forms
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  
  const [showCheckin, setShowCheckin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const ud = await getUserData(u.uid);
          setUserData(ud || null);
        } catch (e) {
          console.error('Error fetching data:', e);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    setAuthError('');
    try {
      if (isLoginFlow) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const startProgram = async () => {
    if (!weight || !user) return;
    const newData: UserData = { 
      startDate: date, 
      startWeight: parseFloat(weight),
      startPictureUrl: null,
      currentLevelId: '1B'
    };
    await saveUserDataDB(user.uid, newData);
    setUserData(newData);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  // --- 1. NOT AUTHENTICATED: Show Login Screen ---
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{isLoginFlow ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>Sync with the web app</Text>
          {authError ? <Text style={{ color: 'red', marginBottom: 10 }}>{authError}</Text> : null}
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Email" 
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Password" 
            secureTextEntry 
          />
          <Button title={isLoginFlow ? 'Sign In' : 'Sign Up'} onPress={handleAuth} color="#FF3366" />
          <TouchableOpacity onPress={() => setIsLoginFlow(!isLoginFlow)} style={{marginTop: 15}}>
             <Text style={{textAlign: 'center', color: '#00E5FF'}}>
               {isLoginFlow ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
             </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- 2. AUTHENTICATED BUT NO DATA: Show Onboarding ---
  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>The Busy Dad Program</Text>
          <Text style={styles.subtitle}>Enter Day 1 Stats</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="Weight in lbs/kg" keyboardType="numeric" />
          <Button title="Start Journey" onPress={startProgram} color="#FF3366" />
          <View style={{marginTop: 20}}>
            <Button title="Logout" onPress={handleLogout} color="#888" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- 3. AUTHENTICATED WITH DATA: Show Dashboard ---
  const daysPassed = Math.max(0, differenceInDays(new Date(), new Date(userData.startDate)));
  const currentLevelObj = userData.currentLevelId ? LEVELS.find(l => l.id === userData.currentLevelId) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>My Burpee Journey</Text>
        <Text style={styles.desc}>Day {daysPassed} • Schedule: Mon, Tue, Thu, Fri</Text>

        <View style={styles.statsCard}>
           {currentLevelObj && (
             <Text style={[styles.statLine, { color: '#00E5FF', fontWeight: 'bold', marginBottom: 10 }]}>
               Current: {currentLevelObj.name}
             </Text>
           )}
           <Text style={styles.statLine}>Start Date: {userData.startDate}</Text>
           <Text style={styles.statLine}>Starting Weight: {userData.startWeight}</Text>
           {userData.endDate && (
             <>
               <Text style={[styles.statLine, {marginTop: 10, color: '#00E5FF'}]}>Milestone: {userData.endDate}</Text>
               <Text style={styles.statLine}>New Weight: {userData.endWeight}</Text>
             </>
           )}
        </View>

        <Text style={[styles.header, { fontSize: 22, marginTop: 20 }]}>Levels</Text>
        {LEVELS.map((lvl) => {
          const isCurrent = userData.currentLevelId === lvl.id;
          return (
            <View key={lvl.id} style={[styles.levelCard, isCurrent && { borderColor: '#FF3366', borderWidth: 2 }]}>
              <Text style={styles.levelTitle}>{lvl.name} {isCurrent && '(Active)'}</Text>
              <Text style={styles.levelDesc}>{lvl.description}</Text>
            </View>
          );
        })}

        <View style={{ marginTop: 40, marginBottom: 40 }}>
           <Button title="Log Out" onPress={handleLogout} color="#444" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  card: { padding: 20, margin: 20, backgroundColor: '#141414', borderRadius: 16, borderColor: '#333', borderWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF3366', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#ccc', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 15 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  desc: { fontSize: 16, color: '#888', marginBottom: 20 },
  statsCard: { backgroundColor: '#141414', padding: 15, borderRadius: 12, borderColor: '#333', borderWidth: 1 },
  statLine: { color: '#ddd', fontSize: 16, marginBottom: 4 },
  levelCard: { backgroundColor: '#141414', padding: 15, borderRadius: 12, marginBottom: 10, borderColor: '#333', borderWidth: 1 },
  levelTitle: { color: '#00E5FF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  levelDesc: { color: '#aaa', fontSize: 14 }
});
