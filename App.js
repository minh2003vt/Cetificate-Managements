import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./src/utils/navigationService"; // Thêm dòng này

import Login from "./src/navigation/screens/Login";
import Main from "./src/navigation/Main";
import Schedule from "./src/navigation/screens/Schedule";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}> 
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={Main} options={{ headerShown: false }} />
        <Stack.Screen name="Schedule" component={Schedule} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
