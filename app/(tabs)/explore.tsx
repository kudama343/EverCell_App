import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '@/utils/supabase';

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  // Function to fetch data from Supabase
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('prediction')
        .select('future_voltage, forecasted_time, id') // Include id for sorting by insertion
        .order('id', { ascending: false }); // Order by id descending (newest first)
      
      if (error) {
        throw error;
      }

      // Format the data for display
      const formattedData = data.map(item => ({
        ...item,
        datetime: item.forecasted_time.toLocaleString() // Format the timestamp
      }));

      setPredictions(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setLoading(false);
    }
  };

  fetchData();
}, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        {/* E-scooter background image */}
        <Image
          source={require('@/assets/images/escooterbg.png')}
          style={styles.reactLogo}
        />
        
        {/* Top Section with Voltage and Time */}
        <View style={styles.topSection}>
          <Text style={styles.DataLogText}>Data Log</Text>
        </View>
      </View>

      {/* Scrollable section to display the data */}
      <View style={styles.bottomRedSection}>
        {loading ? (
          <Text style={styles.noDataText}>Loading data...</Text>
        ) : (
          <ScrollView>
            {/* Check if data is available */}
            {predictions.length > 0 ? (
              predictions.map((prediction, index) => (
                <View key={index} style={styles.predictionContainer}>
                  <Text style={styles.predictionRowText}>{prediction.datetime}</Text>
                  <Text style={styles.predictionRowText2}>{prediction.future_voltage.toFixed(2)}V</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No data available</Text>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',  // Background color for safe area
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
    flex: 1,
    justifyContent: 'center', // Vertically center the text
    alignItems: 'center',     // Horizontally center the text
    position: 'absolute',     // Ensures it's over the image
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  DataLogText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  bottomRedSection: {
    backgroundColor: '#1F9753',  // Green background
    padding: 20,
    borderTopLeftRadius: 25,     // Top-left corner radius
    borderTopRightRadius: 25,    // Top-right corner radius
    marginTop: -10,              // Merge into header section, negative margin to remove space
    flex: 1,
  },
  predictionText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 5,
  },
  noDataText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 20,
  },
  predictionContainer: {
    flexDirection: 'row',    // Arrange items in a row
    justifyContent: 'space-between', // Distribute space between date and voltage
    alignItems: 'center',    // Vertically center the items
    backgroundColor: '#fff',  // White background for each data block
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10, // Shadow for Android
  },
  predictionRowText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'left', // Center text horizontally in its column
   // Ensure both texts take equal space
  },
  predictionRowText2: {
    fontSize: 20,
    color: '#000', 
    textAlign: 'right', // Center text horizontally in its column
    flex: 1, // Ensure both texts take equal space
    fontWeight: 'bold',
    marginRight: 20
  },
});