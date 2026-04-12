import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

interface WorkoutTimerProps {
  initialMinutes?: number;
  onFinish?: () => void;
  sealsGoal?: number;
  sixCountsGoal?: number;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ 
  initialMinutes = 20, 
  onFinish,
  sealsGoal = 0,
  sixCountsGoal = 0
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'N' | 'C'>('N');
  const [currentRep, setCurrentRep] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load sound once
  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' } // Short beep
        );
        soundRef.current = sound;
      } catch (e) {
        console.log("Error loading sound", e);
      }
    }
    loadSound();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playBeep = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.replayAsync();
      } catch (e) {
        console.log("Error playing beep", e);
      }
    }
  };

  // Calculate pacing
  const goal = mode === 'N' ? sealsGoal : sixCountsGoal;
  const totalSeconds = initialMinutes * 60;
  const intervalSeconds = goal > 0 ? totalSeconds / goal : 0;
  
  // Calculate display values
  const secondsDone = totalSeconds - secondsLeft;
  const pacerRemainingTime = intervalSeconds > 0 ? (intervalSeconds - (secondsDone % intervalSeconds)) : 0;
  const secondsToNextRep = Math.max(0, Math.ceil(pacerRemainingTime));

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const nextVal = prev - 1;
          const timeElapsed = totalSeconds - nextVal;

          // Check if we hit a rep boundary
          if (intervalSeconds > 0) {
            // Use a small epsilon to handle potential float issues, 
            // though with integers like 24 and 60 it should be fine.
            const rawRep = timeElapsed / intervalSeconds;
            const isRepBoundary = Math.abs(rawRep - Math.round(rawRep)) < 0.01;
            
            if (isRepBoundary && timeElapsed > 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              playBeep();
              setCurrentRep(Math.round(rawRep));
            }
          }
          
          return nextVal;
        });
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulseAnim.setValue(1);
      
      if (secondsLeft === 0 && isActive) {
        setIsActive(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (onFinish) onFinish();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft, intervalSeconds, totalSeconds]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
    setSecondsLeft(totalSeconds);
    setCurrentRep(0);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeToggle}>
        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'N' && styles.modeBtnActive]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('N');
            resetTimer();
          }}
        >
          <Text style={[styles.modeBtnText, mode === 'N' && styles.modeBtnTextActive]}>Navy Seals</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modeBtn, mode === 'C' && styles.modeBtnActive]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMode('C');
            resetTimer();
          }}
        >
          <Text style={[styles.modeBtnText, mode === 'C' && styles.modeBtnTextActive]}>6-Counts</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[
        styles.timerCircle, 
        { transform: [{ scale: pulseAnim }] },
        isActive && styles.activeTimerCircle
      ]}>
        <Text style={styles.timeText}>{formatTime(secondsLeft)}</Text>
        
        {goal > 0 ? (
          <View style={styles.pacerInfo}>
            <Text style={styles.repCount}>REP {currentRep} / {goal}</Text>
            {isActive && (
              <Text style={styles.nextRepText}>Next in {secondsToNextRep}s</Text>
            )}
          </View>
        ) : (
          <Text style={styles.label}>Minutes Remaining</Text>
        )}
      </Animated.View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={resetTimer}>
          <Ionicons name="refresh" size={24} color="#888" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.playBtn, isActive ? styles.pauseBtn : null]} 
          onPress={toggleTimer}
        >
          <Ionicons 
            name={isActive ? "pause" : "play"} 
            size={32} 
            color="#fff" 
            style={{ marginLeft: isActive ? 0 : 4 }}
          />
        </TouchableOpacity>

        <View style={styles.controlBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 25,
    padding: 4,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#222',
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeBtnActive: {
    backgroundColor: '#333',
  },
  modeBtnText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 13,
  },
  modeBtnTextActive: {
    color: '#00E5FF',
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    borderColor: '#1a1a1a',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  activeTimerCircle: {
    borderColor: '#FF3366',
    shadowColor: '#FF3366',
    shadowOpacity: 0.2,
  },
  timeText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  pacerInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  repCount: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nextRepText: {
    color: '#FF3366',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 20,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  pauseBtn: {
    backgroundColor: '#333',
    shadowColor: '#000',
  }
});
