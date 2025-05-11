import React, { useEffect, useState, useRef } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PredictedFutureVoltage() {
  const [prediction, setPrediction] = useState(null);
const [timeRemaining, setTimeRemaining] = useState({ minutes: 15, seconds: 0 });
const [nextReset, setNextReset] = useState('');
const [timerActive, setTimerActive] = useState(true);
const [showModal, setShowModal] = useState(false);
const [profitValue, setProfitValue] = useState(null);
const [updateTime, setUpdateTime] = useState(null); // New state for update_time
const timerRef = useRef(null);
const realtimeSubscription = useRef(null);
const router = useRouter();

  // Calculate time remaining from now (always 15 minutes)
  const calculateTimeRemainingFromNow = () => {
    // Set timer to 15 minutes (15:00)
    setTimeRemaining({
      minutes: 15,
      seconds: 0
    });
    
    // Calculate and set the next reset time (current time + 15 minutes)
    const now = new Date();
    const nextResetTime = new Date(now.getTime() + 15 * 60000);
    
    // Format time to HH:MM format
    const hours = nextResetTime.getHours();
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const amPm = hours >= 12 ? 'PM' : 'AM';
    const formattedMinutes = nextResetTime.getMinutes().toString().padStart(2, '0');
    
    setNextReset(`${formattedHours}:${formattedMinutes} ${amPm}`);
  };

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('prediction')
      .select('future_voltage, forecasted_time')
      .order('id', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching prediction data:', error);
    } else if (data && data.length > 0) {
      setPrediction(data[0]);
    }
  };

  const fetchAdminProfit = async () => {
  const { data, error } = await supabase
    .from('admin_data')
    .select('profit')
    .eq('role', 'admin')
    .single();
  
  if (error) {
    console.error('Error fetching admin profit data:', error);
  } else if (data) {
    setProfitValue(data.profit);
    
    // Check if profit is 0, stop timer and show modal
    if (data.profit === 0) {
      setTimerActive(false);
      setShowModal(true);
      
      // Clear existing timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // If profit is not 0, start the timer
      setShowModal(false);
      setTimerActive(true);
      
      // Clear any existing timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Start fresh timer
      startTimers();
    }
  }
};

  // Function to start timers
  const startTimers = () => {
    // First, calculate the new time
    calculateTimeRemainingFromNow();
    
    // Set up timer to update countdown every second
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          // When timer reaches zero, fetch new data and reset timer to 15 minutes again
          fetchData();
          calculateTimeRemainingFromNow();
          return { minutes: 15, seconds: 0 }; // Reset to 15 minutes
        }
      });
    }, 1000);
  };

  // Setup Realtime subscription for admin_data table
  const setupRealtimeSubscription = () => {
  realtimeSubscription.current = supabase
    .channel('admin_data_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'admin_data',
        filter: 'role=eq.admin'
      }, 
      (payload) => {
        console.log('Realtime update received:', payload.new);
        
        if (payload.new && payload.new.profit !== undefined) {
          const oldProfitValue = profitValue; // Store current profit value before updating
          setProfitValue(payload.new.profit);
          
          if (payload.new.profit === 0) {
            // Stop timer and show modal
            setTimerActive(false);
            setShowModal(true);
            
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          } else if (payload.new.profit !== 0) {
            // Important: Check if we're coming from a 0 profit value or timer is inactive
            if (oldProfitValue === 0 || !timerActive) {
              console.log('Starting timer - profit changed from 0 to non-zero');
              setShowModal(false);
              setTimerActive(true);
              
              // Clear any existing timer first
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // Start fresh timer
              startTimers();
            }
          }
        }
      }
    )
    .subscribe();
};

  // Set up the initial data and timers
  useEffect(() => {
  // Initial fetch
  fetchData();
  fetchAdminProfit(); // This will now handle starting the timer if needed
  
  // Setup realtime subscription
  setupRealtimeSubscription();
  
  // Cleanup function
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (realtimeSubscription.current) realtimeSubscription.current.unsubscribe();
  };
}, []); // Empty dependency array - only run on mount

  const batteryStatus = prediction && prediction.future_voltage >= 30 ? 'Healthy' : 'Needs Maintenance';
  const statusColor = prediction && prediction.future_voltage >= 30 ? '#1F9753' : '#F45A5A';

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Next Update In:</Text>
        <Text style={[styles.timerValue, !timerActive && styles.timerInactive]}>
          {timerActive 
            ? `${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`
            : '00:00'
          }
        </Text>
        <Text style={styles.nextResetText}>
          {timerActive 
            ? `Next reset at ${nextReset}`
            : 'Timer stopped - No battery attached'
          }
        </Text>
      </View>
      
      {prediction ? (
        <View style={styles.predictionContainer}>
          <View style={styles.voltageContainer}>
            <Text style={styles.voltageLabel}>Forecasted Voltage</Text>
            <Text style={styles.voltageValue}>{prediction.future_voltage} V</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Battery Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{batteryStatus}</Text>
            </View>
          </View>
          
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Forecasted Time</Text>
            <Text style={styles.timeValue}>{prediction.forecasted_time}</Text>
          </View>
          
          {profitValue !== null && (
            <View style={styles.profitContainer}>
              <Text style={styles.profitLabel}>Connection Status</Text>
              <Text style={styles.profitValue}>
                {profitValue === 0 ? 'No Battery Connected' : 'Battery Connected'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prediction data...</Text>
        </View>
      )}
      
      {/* Modal for no battery attached */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={50} color="#F45A5A" />
            <Text style={styles.modalTitle}>No Battery Attached</Text>
            <Text style={styles.modalText}>
              The system has detected that there is no battery currently attached.
              The timer has been stopped until a battery is connected.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 2,
  },
  timerInactive: {
    color: '#999',
  },
  nextResetText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  predictionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voltageContainer: {
    marginBottom: 25,
  },
  voltageLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  voltageValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    marginBottom: 25,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeContainer: {
    marginBottom: 25,
  },
  timeLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  timeValue: {
    fontSize: 22,
    color: '#333',
  },
  profitContainer: {
    marginBottom: 10,
  },
  profitLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  profitValue: {
    fontSize: 22,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#555',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});