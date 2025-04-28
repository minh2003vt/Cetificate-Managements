import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from './src/context/ThemeContext';
import Main from './src/navigation/Main';
import Login from './src/navigation/screens/auth/Login';
import ForgotPassword from './src/navigation/screens/auth/ForgotPassword';
import ResetPassword from './src/navigation/screens/auth/ResetPassword';
import Schedule from "./src/navigation/screens/home/Schedule";
import { navigationRef } from "./src/utils/navigationService"; // Thêm dòng này
import { LogBox } from 'react-native';

// Bỏ qua tất cả cảnh báo về VirtualizedLists lồng nhau
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested', 
  'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation',
  'Possible Unhandled Promise Rejection'
]);

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
            name="ForgotPassword"
            component={ForgotPassword}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPassword}
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
