import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Modal, Animated } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  
const [predictions, setPredictions] = useState([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [voltageModalVisible, setVoltageModalVisible] = useState(false);
const [healthModalVisible, setHealthModalVisible] = useState(false);
const [reminderModalVisible, setReminderModalVisible] = useState(false);
const [hasNewData, setHasNewData] = useState(false);
const [notificationOpacity] = useState(new Animated.Value(0));
const [loadingModal, setLoadingModal] = useState(false);
const [statusModal, setStatusModal] = useState(false);
const router = useRouter();

  const fetchData = async (showLoading = false) => {
    if (showLoading) {
      setLoadingModal(true);
      // Set 3 second delay
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      setLoading(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('prediction')
        .select('future_voltage, forecasted_time')
        .order('id', { ascending: false });
      
      if (error) throw error;
      setPredictions(data);
      setHasNewData(false); // Reset notification state after fetching
      
      if (showLoading) {
        setLoadingModal(false);
        setStatusModal(true); // Show status modal after loading
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up Supabase realtime subscription
    const subscription = supabase
      .channel('prediction-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'prediction' 
        }, 
        (payload) => {
          console.log('New prediction inserted:', payload);
          setHasNewData(true);
          // Animate notification appearance
          showNotification();
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Animation function for notification appearance
  const showNotification = () => {
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(notificationOpacity, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;
  const futureVoltage = latestPrediction?.future_voltage || 0;
  const forecastedTime = latestPrediction?.forecasted_time || 'N/A';

  const isVoltageLow = futureVoltage < 30;
  const batteryHealthMessage = isVoltageLow
    ? "A potential issue with the battery's voltage is predicted; maintenance are advised."
    : "The battery's forecasted voltage is within the normal range, no immediate action is required.";
  const bottomSectionColor = isVoltageLow ? '#F45A5A' : '#1F9753';
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Notification Button */}
      {hasNewData && (
        <Animated.View style={[styles.notificationContainer, { opacity: notificationOpacity }]}>
          <TouchableOpacity 
            style={styles.newDataButton}
            onPress={() => fetchData(true)}
          >
            <Text style={styles.newDataButtonText}>New Prediction Available!</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEnabled={false}
      >
        <View style={styles.headerContainer}>
          <Image source={require('@/assets/images/escooterbg.png')} style={styles.reactLogo} />
          <View style={styles.topSection}>
            {(
              <>
                <Text style={styles.textHome}>Home</Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.bottomRedSection, { backgroundColor: bottomSectionColor }]}>
          <TouchableOpacity onPress={() => setVoltageModalVisible(true)}>
            <View style={styles.middleSection}>
              <View style={styles.row}>
                <Text style={styles.labelLeft}>Future Battery Health</Text>
              </View>
              <View style={[styles.line, { backgroundColor: bottomSectionColor }]} />
              <Text style={styles.valueFutureBatteryHealth}>{batteryHealthMessage}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/predictedFutureVoltage')}>
            <View style={styles.bottomSection}>
              <View style={styles.row}>
                <Text style={styles.labelLeft}>Forecasted Voltage</Text>
              </View>
              <View style={[styles.line, { backgroundColor: bottomSectionColor }]} />
              <Text style={styles.valueForcastedVoltage}>{futureVoltage} V</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setHealthModalVisible(true)}>
            <View style={styles.bottomSection}>
              <View style={styles.row}>
                <Text style={styles.labelLeft}>Forecasted Time</Text>
              </View>
              <View style={[styles.line, { backgroundColor: bottomSectionColor }]} />
              <Text style={styles.valueForecastedTime}>{forecastedTime}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Voltage Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={voltageModalVisible}
          onRequestClose={() => setVoltageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Future Battery Health Status</Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Healthy:</Text> The battery is operating optimally with no immediate maintenance required.
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Need Maintenance:</Text> The battery may need attention to maintain its performance. Please inspect and perform necessary maintenance.
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.infoButton} onPress={() => {
                  setVoltageModalVisible(false);
                  setTimeout(() => {
                    // Show the reminder modal after closing the current one
                    setReminderModalVisible(true);
                  }, 300);
                }}>
                  <Text style={styles.infoButtonText}>ℹ️ Info</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.OKbtn} onPress={() => setVoltageModalVisible(false)}>
                  <Text style={styles.OKbtntext}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={reminderModalVisible}
          onRequestClose={() => setReminderModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Reminder</Text>
              <Text style={styles.modalText}>
                IEC 62660-3 is an international standard for lithium-ion batteries in electric vehicles. Maintaining a Nominal voltage of 36V or above ensures optimal performance, longevity, and reliability for your e-scooter's battery.
              </Text>
              <TouchableOpacity style={styles.OKbtn} onPress={() => setReminderModalVisible(false)}>
                <Text style={styles.OKbtntext}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Health Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={healthModalVisible}
          onRequestClose={() => setHealthModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Forecasted Time</Text>
              <Text style={styles.modalText}>
                This is the predicted time when the battery health reading will reach the forecasted voltage level. For Li-ion battery packs used in e-scooters, this forecast helps you plan maintenance and charging schedules to optimize battery life.
              </Text>
              <TouchableOpacity style={styles.OKbtn} onPress={() => setHealthModalVisible(false)}>
                <Text style={styles.OKbtntext}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Loading Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={loadingModal}
          onRequestClose={() => setLoadingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.loadingContainer}>
              <View style={styles.loadingIndicator}>
                <View style={styles.spinnerContainer}>
                  {[...Array(12)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.spinnerDot,
                        {
                          transform: [
                            { rotate: `${i * 30}deg` },
                            { translateY: -30 },
                          ],
                          opacity: 1 - (i * 0.08),
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.loadingText}>Updating battery prediction...</Text>
            </View>
          </View>
        </Modal>
        
        {/* Status Update Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={statusModal}
          onRequestClose={() => setStatusModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.statusContainer, { backgroundColor: isVoltageLow ? '#F45A5A' : '#1F9753' }]}>
              <Text style={styles.statusTitle}>
                {isVoltageLow ? 'Battery Needs Maintenance' : 'Battery Health Status: Good'}
              </Text>
              <View style={styles.statusIconContainer}>
                {isVoltageLow ? (
                  <View style={styles.warningIcon}>
                    <Text style={styles.iconText}>!</Text>
                  </View>
                ) : (
                  <View style={styles.checkIcon}>
                    <Text style={styles.iconText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.statusMessage}>
                {isVoltageLow 
                  ? 'Your e-scooter battery is predicted to fall below the recommended voltage level. Schedule maintenance soon to prevent performance issues.'
                  : 'Your e-scooter battery is predicted to maintain a healthy voltage level. No immediate action is required.'}
              </Text>
              <Text style={styles.voltageReadout}>Forecasted Voltage: {futureVoltage} V</Text>
              <TouchableOpacity 
                style={[styles.statusBtn, { backgroundColor: isVoltageLow ? '#9D3A3A' : '#176B3A' }]} 
                onPress={() => setStatusModal(false)}
              >
                <Text style={styles.OKbtntext}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  spinner: {
    width: 40,
    height: 40,
    position: 'absolute',
    alignSelf: 'center',
  },
  
 spinnerContainer: {
  width: 70,
  height: 70,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
},
spinnerDot: {
  position: 'absolute',
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#1F9753',
},
 loadingContainer: {
  width: '90%',
  backgroundColor: 'white',
  borderRadius: 15,
  padding: 30,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
loadingIndicator: {
  width: 140,
  height: 140,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
},
loadingLogo: {
  width: 80,
  height: 80,
  resizeMode: 'contain',
},
loadingText: {
  fontSize: 20,
  fontWeight: '500',
  color: '#444',
  textAlign: 'center',
},
  statusContainer: {
    width: '80%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F45A5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1F9753',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  statusMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  voltageReadout: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  statusBtn: {
    paddingHorizontal: 50,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  headerContainer: {
    position: 'relative',
    height: 220,
    width: '100%',
    marginBottom: -20,
  },
  reactLogo: {
    height: 350,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  textHome: {
    fontSize: 80,
    fontWeight: '600',
    color: '#FFF',
    marginVertical: 1,
    textAlign: 'center',
    marginTop: 30,
  },
  bottomRedSection: {
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -10,
    paddingBottom: 500,
  },
  middleSection: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 15,
    marginTop: 2,
  },
  bottomSection: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
  },
  modalButtonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  marginTop: 10,
},
infoButton: {
  backgroundColor: '#4A90E2',
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 5,
},
infoButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  valueFutureBatteryHealth: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
    textAlign: 'right',
    padding: 5,
  },
  valueForcastedVoltage: {
    fontSize: 45,
    color: '#000',
    textAlign: 'right',
    padding: 5,
  },
  valueForecastedTime: {
    fontSize: 30,
    color: '#000',
    textAlign: 'right',
    padding: 5,
  },
  line: {
    height: 3,
    marginVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'justify',
    marginBottom: 20,
  },
  OKbtn: {
    backgroundColor: '#1F9753',
    paddingHorizontal: 50,
    paddingVertical: 10,
    borderRadius: 5,
  },
  OKbtntext: {
    color: 'white',
  },
  notificationContainer: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 999,
    elevation: 5,
  },
  newDataButton: {
    backgroundColor: '#1F9753',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newDataButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});