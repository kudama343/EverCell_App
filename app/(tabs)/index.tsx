import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voltageModalVisible, setVoltageModalVisible] = useState(false); // Voltage modal state
  const [healthModalVisible, setHealthModalVisible] = useState(false); // Health modal state
  const router = useRouter(); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prediction')
        .select('future_voltage, forecasted_time');
      
      if (error) throw error;
      setPredictions(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
              <Text style={styles.modalTitle}>Reminder</Text>
              <Text style={styles.modalText}>
                IEC 62660-3 is an international standard for lithium-ion batteries in electric vehicles. Maintaining a Nominal voltage of 36V or above ensures optimal performance, longevity, and reliability for your e-scooter's battery.
              </Text>
              <TouchableOpacity style={styles.OKbtn} onPress={() => setVoltageModalVisible(false)}>
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
              <Text style={styles.modalTitle}>Future Battery Health Status</Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Healthy:</Text> The battery is operating optimally with no immediate maintenance required.
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: 'bold' }}>Need Maintenance:</Text> The battery may need attention to maintain its performance. Please inspect and perform necessary maintenance.
              </Text>
              <TouchableOpacity style={styles.OKbtn} onPress={() => setHealthModalVisible(false)}>
                <Text style={styles.OKbtntext}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Battery Status Modal */}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const additionalStyles = {
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  spinnerOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 6,
    borderColor: '#1F9753',
    borderTopColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinnerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    color: '#ffffff',
  },
  statusIconContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthyIcon: {
    backgroundColor: '#1F9753',
  },
  warningIcon: {
    backgroundColor: '#F45A5A',
  },
  statusIconText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  healthyText: {
    color: '#1F9753',
  },
  warningText: {
    color: '#F45A5A',
  },
  voltageText: {
    fontSize: 18,
    fontWeight: '500',
    marginVertical: 10,
    textAlign: 'center',
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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