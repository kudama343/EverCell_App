import { Tabs } from 'expo-router';
import React from 'react';
import { Image, View, Dimensions } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { width } = Dimensions.get('window'); // Get the width of the screen

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 10,  // Add padding at the bottom of the tab bar
          paddingTop: 10,     // Add padding at the top of the tab bar
          height: 50,         // Adjust height if needed
          backgroundColor: '#CDD1D0',  // Background color of the whole tab bar
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: width / 2,  // Set the width to half of the screen
                
                backgroundColor: focused ? 'white' : '#CDD1D0',  // White when focused
                borderTopLeftRadius: 10,
                borderTopEndRadius: 10, // Optional: round the edges for a nicer look
                alignItems: 'center',  // Center the icon
                justifyContent: 'center', // Vertically center the icon
                padding: 16,
                paddingBottom:25
              }}
            >
              <Image
                source={require('../../assets/images/Home.png')}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: width / 2,  // Set the width to half of the screen
                backgroundColor: focused ? 'white' : '#CDD1D0',  // White when focused
                borderTopEndRadius: 10,
                borderTopLeftRadius: 10,
                alignItems: 'center',  // Center the icon
                justifyContent: 'center',
                padding: 16,
                paddingBottom:25,
                
              }}
            >
              <Image
                source={require('../../assets/images/Menu.png')}
                style={{
                  width: 40,
                  height: 40,
                }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
