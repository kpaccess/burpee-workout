import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, addMonths, isAfter } from 'date-fns';

const STORAGE_KEY = 'burpee_workout_userData';

interface UserData {
  startDate: string;
  startWeight: string;
  endDate?: string;
  endWeight?: string;
}

const LEVELS = [
  { id: '1A', name: 'Level 1A', desc: 'No Landmark Workout' },
  { id: '1B', name: 'Level 1B', desc: '20 Seals, 50 6-counts in 20m' },
  { id: '1C', name: 'Level 1C', desc: '40 Seals, 100 6-counts in 20m' },
  { id: '1D', name: 'Level 1D', desc: '60 Seals, 150 6-counts in 20m' },
  { id: '2', name: 'Level 2', desc: '80 Seals, 200 6-counts in 20m' },
  { id: '3', name: 'Level 3', desc: '100 Seals, 250 6-counts in 20m' },
  { id: '4', name: 'Level 4', desc: '120 Seals, 275 6-counts in 20m' },
];

export default function HomeScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  
  const [showCheckin, setShowCheckin] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
        const start = new Date(parsed.startDate);
        const milestone = addMonths(start, 6);
        if (isAfter(new Date(), milestone) && !parsed.endDate) {
          setShowCheckin(true);
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const startProgram = async () => {
    if (!weight) return;
    const newData = { startDate: date, startWeight: weight };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setUserData(newData);
  };

  const completeCheckin = async () => {
    if (!weight || !userData) return;
    const newData = { ...userData, endDate: date, endWeight: weight };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setUserData(newData);
    setShowCheckin(false);
  };

  const clearData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUserData(null);
  };

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>The Busy Dad Program</Text>
          <Text style={styles.subtitle}>Enter Day 1 Stats</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="Weight in lbs/kg" keyboardType="numeric" />
          <Button title="Start Journey" onPress={startProgram} color="#FF3366" />
        </View>
      </SafeAreaView>
    );
  }

  if (showCheckin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>🎉 6 Month Milestone!</Text>
          <Text style={styles.subtitle}>Update your stats to check-in.</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="New Weight" keyboardType="numeric" />
          <Button title="Log Progress" onPress={completeCheckin} color="#00E5FF" />
          <TouchableOpacity onPress={() => setShowCheckin(false)} style={{marginTop: 10}}>
             <Text style={{textAlign: 'center', color: '#666'}}>Remind Me Later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const daysPassed = Math.max(0, differenceInDays(new Date(), new Date(userData.startDate)));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.header}>My Burpee Journey</Text>
        <Text style={styles.desc}>Day {daysPassed} • Schedule: Mon, Tue, Thu, Fri</Text>

        <View style={styles.statsCard}>
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
        {LEVELS.map(lvl => (
          <View key={lvl.id} style={styles.levelCard}>
            <Text style={styles.levelTitle}>{lvl.name}</Text>
            <Text style={styles.levelDesc}>{lvl.desc}</Text>
          </View>
        ))}

        <View style={{ marginTop: 40, marginBottom: 40 }}>
           <Button title="Reset Data" onPress={clearData} color="#444" />
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
