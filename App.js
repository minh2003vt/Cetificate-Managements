import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from './src/context/ThemeContext';
import Main from './src/navigation/Main';
import Login from './src/navigation/screens/Login';
import Schedule from "./src/navigation/screens/Schedule";
import { navigationRef } from "./src/utils/navigationService"; // Thêm dòng này

const Stack = createStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={Main}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Schedule" component={Schedule} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
