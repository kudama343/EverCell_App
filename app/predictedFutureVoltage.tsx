import React, { useEffect, useState } from 'react';
import { View, ScrollView, Dimensions, Text, SafeAreaView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { supabase } from './(tabs)/SupaBaseConfig';
import { AntDesign } from '@expo/vector-icons';

export default function PredictedFutureVoltage() {
  const [chartData, setChartData] = useState(null);
  const [displayedData, setDisplayedData] = useState(null);
  const router = useRouter();
  const [visibleItems, setVisibleItems] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('future_prediction')
        .select('future_voltage, datetime');
      
      if (error) {
        console.error('Error fetching data:', error);
      } else {
        // Process datetime and voltage data
        const labels = data.map(item => {
          const [time, date] = item.datetime.split(' ');
          return `${time} ${date}`;
        });

        const values = data.map(item => item.future_voltage);

        // Add "Next Usage" to the end of labels and duplicate the last voltage value
        labels.push('Next Usage');
        if (values.length > 0) {
          values.push(values[values.length - 1]); // Duplicate the last voltage value
        }

        const fullData = {
          labels,
          datasets: [
            {
              data: values,
              color: () => 'rgba(255, 255, 0, 1)', // Line color yellow
              strokeWidth: 2,
            },
            {
              data: Array(data.length + 1).fill(36), // Threshold line at 36
              color: () => 'rgba(244, 90, 90, 1)', // Threshold line color red
              strokeWidth: 1,
            }
          ],
          legend: ['Predicted Voltage', 'Threshold'],
        };

        setChartData(fullData);
        updateDisplayedData(fullData, visibleItems);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (chartData) {
      updateDisplayedData(chartData, visibleItems);
    }
  }, [visibleItems, chartData]);

  const updateDisplayedData = (data, itemsCount) => {
    // Get the total number of data points
    const totalItems = data.labels.length;
  
    // Slice the last 'itemsCount' items from the data, including the last item as "Next Usage"
    const startSliceIndex = Math.max(0, totalItems - itemsCount);
    
    const limitedData = {
      ...data,
      labels: data.labels.slice(startSliceIndex),
      datasets: data.datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.slice(startSliceIndex),
      })),
    };
  
    setDisplayedData(limitedData);
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <AntDesign name="arrowleft" size={24} color="black" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <ScrollView>
        <View style={styles.chartContainer}>
          <Text style={styles.title}>Predicted Voltage vs Date and Time </Text>
          {displayedData ? (
            <LineChart
              segments={10}
              data={displayedData}
              width={Dimensions.get('window').width - 40}
              height={410}
              yAxisSuffix="V"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#1F9753',
                backgroundGradientTo: '#1F9753',
                decimalPlaces: 1,
                color: () => 'rgba(255, 255, 255, 0)',
                labelColor: () => 'rgba(255, 255, 255, 5)',
                propsForLabels: {
                  dx: '-0.1em',
                  dy: '-0.2em',
                },
                propsForDots: {
                  r: '4',
                }
              }}
              verticalLabelRotation={90}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text>Loading chart data...</Text>
          )}
          <Text style={styles.sliderLabel}>Number of Items:</Text>
          <Slider
  style={styles.slider}
  minimumValue={5}
  maximumValue={chartData ? chartData.labels.length : 5} // Add a check for chartData
  step={1}
  value={visibleItems}
  onValueChange={value => {
    setVisibleItems(value);
    if (chartData) {
      updateDisplayedData(chartData, value);
    }
  }}
  minimumTrackTintColor="#0d915e"
  maximumTrackTintColor="#69bf8b"
  thumbTintColor="#1F975F"
/>


          <Text style={styles.sliderValue}>Displaying {visibleItems} items</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sliderLabel: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  slider: {
    width: Dimensions.get('window').width - 80,
    height: 60,
    alignSelf: 'center',
    
  },
  sliderValue: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 30
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 30,
    paddingTop:30,
    marginTop: 10,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
  },
  chartContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
