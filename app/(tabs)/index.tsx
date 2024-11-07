import React, { useEffect, useState, useCallback } from 'react';
import { Image, StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { supabase } from './SupaBaseConfig';
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
        .from('future_prediction')
        .select('future_voltage, datetime, future_health');
      
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

  const isHealthy = predictions.length > 0 && predictions[0].future_health === 'Healthy';
  const bottomSectionColor = isHealthy ? '#1F9753' : '#f94144';
  const lineColor = isHealthy ? '#1F9753' : '#f94144';
  const batteryHealthFontSize = isHealthy ? 40 : 25;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollEnabled={false}
      >
        <View style={styles.headerContainer}>
          <Image source={require('@/assets/images/escooterbg.png')} style={styles.reactLogo} />

          <View style={styles.topSection}>
            <View style={styles.chargeBox}>
              <Text style={styles.chargeText}>Full charge your E-scooter first</Text>
            </View>
            {predictions.length > 0 && (
              <>
                <TouchableOpacity onPress={() => router.push('/predictedFutureVoltage')}>
                  <Text style={styles.voltageText}>
                    {predictions[predictions.length - 1].future_voltage.toFixed(2)}V
                  </Text>
                  <Text style={styles.predictedText}>Predicted future voltage</Text>
                </TouchableOpacity>
                <Text style={styles.timeText}>{predictions[predictions.length - 1].datetime}</Text>
              </>
            )}
          </View>
        </View>

        <View style={[styles.bottomRedSection, { backgroundColor: bottomSectionColor }]}>
          {/* Suggested Future Voltage Section */}
          <TouchableOpacity onPress={() => setVoltageModalVisible(true)}>
            <View style={styles.middleSection}>
              <View style={styles.row}>
                <Text style={styles.labelLeft}>Suggested future voltage</Text>
              </View>
              <View style={[styles.line, { backgroundColor: lineColor }]} />
              <Text style={styles.valueRightSuggested}>36 volts above</Text>
            </View>
          </TouchableOpacity>

          {/* Future Battery Health Section */}
          <TouchableOpacity onPress={() => setHealthModalVisible(true)}>
            <View style={styles.bottomSection}>
              <View style={styles.row}>
                <Text style={styles.labelLeft}>Future Battery Health</Text>
              </View>
              <View style={[styles.line, { backgroundColor: lineColor }]} />
              <Text style={[styles.valueRightBatteryHealth, { fontSize: batteryHealthFontSize }]}>
                {predictions.length > 0 && predictions[0].future_health}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Voltage Modal for IEC 62660-3 Reminder */}
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
                IEC 62660-3 is an international standard for lithium-ion batteries in electric vehicles. Maintaining a voltage of 36V or above ensures optimal performance, longevity, and reliability for your e-scooter's battery.
              </Text>
              <TouchableOpacity style={styles.OKbtn} onPress={() => setVoltageModalVisible(false)}>
                <Text style={styles.OKbtntext}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Battery Health Status Modal */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // Background color for safe area
  },
  headerContainer: {
    position: 'relative',
    height: 350, // Adjust height based on design
    width: '100%',
    marginBottom: -20, // Reduce space between header and bottom section
  },
  reactLogo: {
    height: 350,
    width: '100%',
    position: 'absolute', // Ensures it sits behind the content
    bottom: 0,
    left: 0,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 20, // Adjust positioning over the background image
  },
  chargeBox: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 5,
    marginTop: 50,
  },
  chargeText: {
    fontSize: 16,
    color: '#000',
    paddingLeft: 20,
    paddingRight: 20,
  },
  voltageText: {
    fontSize: 80,
    fontWeight: '600', // Updated font weight
    color: '#FFF',
    marginVertical: 1,
  },
  predictedText: {
    fontSize: 25,
    fontWeight: '600', // Updated font weight
    color: '#FFF',
    textDecorationLine: 'underline',
  },
  timeText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  middleSection: {
    backgroundColor: '#f0f0f0', // Light gray background
    padding: 20,
    borderRadius: 15,
   
    marginTop:3
  },
  bottomSection: {
    backgroundColor: '#f0f0f0', // Light gray background
    padding: 20,
    borderRadius: 15,
    marginTop:10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelLeft: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500', // Light weight
    textAlign: 'left', // Align to the left
  },
  valueRightSuggested: {
    fontSize: 40,
    color: '#000',
    fontWeight: '300', // Light weight
    textAlign: 'right', // Align to the right
    padding: 20,
  },
  valueRightBatteryHealth: {
    color: '#000',
    fontWeight: '300', // Light weight
    textAlign: 'right', // Align to the right
    padding: 20,
  },
  line: {
    height: 3,
    marginVertical: 10,
  },
  bottomRedSection: {
    padding: 20,
    borderTopLeftRadius: 25, // Top-left corner radius
    borderTopRightRadius: 25, // Top-right corner radius
    marginTop: -10, // Merge into header section, negative margin to remove space
    paddingBottom: 500,
  },
  touchableOpacity: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#d0d0d0', // Optional: subtle background color for feedback
    marginVertical: 5,
  },
  touchableText: {
    color: '#000',
    fontSize: 18,
  },
  lastVoltageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
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
});
