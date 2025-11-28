// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import delle schermate
import SelectCrmScreen from './src/screens/SelectCrmScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PlannerScreen from './src/screens/PlannerScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import SelectContactScreen from './src/screens/SelectContactScreen';import CreateContactScreen from "./src/screens/CreateContactScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectCrm">
        {/* Prima schermata: selezione CRM */}
        <Stack.Screen
          name="SelectCrm"
          component={SelectCrmScreen}
          options={{ title: 'Seleziona CRM' }}
        />

        {/* Home: calendario/appuntamenti */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Agenda appuntamenti' }}
        />

        {/* Eventi (se la usi) */}
        <Stack.Screen
          name="Events"
          component={EventsScreen}
          options={{ title: 'Eventi' }}
        />

        {/* Calendario full-screen (se la usi) */}
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'Calendario' }}
        />

        {/* Planner (se la usi) */}
        <Stack.Screen
          name="Planner"
          component={PlannerScreen}
          options={{ title: 'Planner' }}
        />
       <Stack.Screen
      name="CreateContact"
      component={CreateContactScreen}
      options={{ title: "Nuovo contatto" }}
        />

        {/* Creazione / modifica appuntamento */}
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ title: 'Appuntamento' }}
        />

        {/* Lista contatti (blocco contatti) */}
        <Stack.Screen
          name="Contacts"
          component={ContactsScreen}
          options={{ title: 'Contatti' }}
        />

        {/* Selezione contatto dalla lista (per CreateEvent) */}
        <Stack.Screen
          name="SelectContact"
          component={SelectContactScreen}
          options={{ title: 'Seleziona contatto' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
