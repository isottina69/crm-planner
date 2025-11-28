import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SelectCrmScreen from './src/screens/SelectCrmScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="SelectCrm"
          component={SelectCrmScreen}
          options={{ title: 'Seleziona CRM' }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Oggi' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}