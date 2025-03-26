import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Import Stack Navigator
import Ionicons from 'react-native-vector-icons/Ionicons';

import Home from "../../src/navigation/screens/Home";
import Notifications from "../../src/navigation/screens/Notifications";
import History from "../../src/navigation/screens/History";
import Courses from "../../src/navigation/screens/Courses";
import CourseDetail from "../../src/navigation/screens/CourseDetail"; // Import CourseDetail
import Settings from "../../src/navigation/screens/Settings";
import Certificate from "../../src/navigation/screens/Certificate"; // Import màn hình Certificate
import Schedule from "../../src/navigation/screens/Schedule"; // Import Schedule
import Profile from "../../src/navigation/screens/Profile";

const HomeTabs = 'Home';
const NotificationsTabs = 'Notification';
const HistoryTabs = 'History';
const CourseTab = 'Courses';
const SettingsTabs = 'Setting';
const ScheduleTab = 'Schedule'; // Add Schedule Tab

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator(); // Create Stack Navigator

function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="History"
        component={History}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Certificate"
        component={Certificate}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator for Courses and CourseDetail
function CoursesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Courses"
        component={Courses}
        options={{ headerShown: false }} // Hide the header in Courses screen
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetail}
        options={{ headerShown: false }} // Hide the header in CourseDetail screen
      />
    </Stack.Navigator>
  );
}

// Stack Navigator for Schedule
function HomeStack() {
  return (
    <Stack.Navigator>
            <Stack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Schedule"
        component={Schedule}
        options={{ headerShown: false }} // Hide the header in Schedule screen
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Language"
        component={Settings} // Tạm thời dùng Settings, sau này thay bằng Language component
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppearanceSettings"
        component={Settings} // Tạm thời dùng Settings, sau này thay bằng AppearanceSettings component
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CertificateManagement"
        component={Certificate}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function Main() {
  return (
    <Tab.Navigator
      initialRouteName={HomeTabs}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let rn = route.name;

          if (rn === HomeTabs) iconName = focused ? 'home' : 'home-outline';
          else if (rn === NotificationsTabs) iconName = focused ? 'notifications' : 'notifications-outline';
          else if (rn === HistoryTabs) iconName = focused ? 'time' : 'time-outline';
          else if (rn === CourseTab) iconName = focused ? 'document-text' : 'document-text-outline';
          else if (rn === SettingsTabs) iconName = focused ? 'settings' : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
      })}
      tabBarOptions={{
        activeTintColor: 'tomato',
        inactiveTintColor: 'grey',
        labelStyle: { paddingBottom: 10, fontSize: 10 },
        style: { padding: 10, height: 70 }
      }}
    >
      <Tab.Screen name={HomeTabs} component={HomeStack} />
      <Tab.Screen name={NotificationsTabs} component={Notifications} />
      <Tab.Screen name={HistoryTabs} component={HistoryStack} />
      <Tab.Screen name={CourseTab} component={CoursesStack} />
      <Tab.Screen name={SettingsTabs} component={SettingsStack} />
    </Tab.Navigator>
  );
}
