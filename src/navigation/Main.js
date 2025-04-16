import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Import Stack Navigator
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnreadCount } from '../services/api';
import { EventRegister } from 'react-native-event-listeners';

// Import các component từ thư mục mới thông qua index.js
import { Home, Schedule } from '../../src/navigation/screens/home';
import { Notifications } from '../../src/navigation/screens/notifications';
import { History, Certificate } from '../../src/navigation/screens/history';
import { Courses, CourseDetail, TrainingPlan, TrainingPlanDetail } from '../../src/navigation/screens/training';
import { Profile } from '../../src/navigation/screens/profile';

const HomeTabs = 'Home';
const NotificationsTabs = 'Notification';
const HistoryTabs = 'History';
const CourseTab = 'Courses';
const TrainingPlanTab = 'TrainingPlan'; // Add TrainingPlan Tab
const ProfileTabs = 'Profile';
const ScheduleTab = 'Schedule';

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

// Stack Navigator for TrainingPlan, TrainingPlanDetail, and CourseDetail
function TrainingPlanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TrainingPlan"
        component={TrainingPlan}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TrainingPlanDetail"
        component={TrainingPlanDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetail}
        options={{ headerShown: false }}
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

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={Profile}
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

const Main = () => {
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      if (userId && token) {
        const response = await getUnreadCount(userId, token);
        console.log('Unread count:', response);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    // Khởi tạo số lượng thông báo khi component mount
    loadUnreadCount();
    
    // Đăng ký các listeners cho các sự kiện khác nhau
    const unreadCountListener = EventRegister.addEventListener(
      'updateNotificationCount',
      (data) => {
        console.log('Received new unread count:', data);
        setUnreadCount(data.unreadCount || 0);
      }
    );

    const newNotificationListener = EventRegister.addEventListener(
      'newNotification',
      () => {
        loadUnreadCount();
      }
    );

    const notificationReadListener = EventRegister.addEventListener(
      'notificationRead',
      () => {
        loadUnreadCount();
      }
    );

    // Cleanup function
    return () => {
      EventRegister.removeEventListener(unreadCountListener);
      EventRegister.removeEventListener(newNotificationListener);
      EventRegister.removeEventListener(notificationReadListener);
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: '#43546A',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 0,
          paddingTop: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        headerShown: false,
        tabBarItemStyle: {
          flex: 1,
          marginHorizontal: 0,
          borderRadius: 0,
          paddingVertical: 8,
          borderRightWidth: route.name === "Settings" ? 0 : 1,
          borderRightColor: '#2C3A4B',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          paddingBottom: 4,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={({ route, navigation }) => ({
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/Homepage.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: '#FFFFFF'
              }}
            />
          ),
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: navigation.isFocused() ? '#009099' : 'transparent',
            marginHorizontal: 0,
            borderRadius: 0,
            paddingVertical: 8,
            borderRightWidth: 1,
            borderRightColor: '#2C3A4B',
          }
        })}
      />
      <Tab.Screen
        name="TrainingPlan"
        component={TrainingPlanStack}
        options={({ route, navigation }) => ({
          tabBarLabel: 'Training Plan',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/Course.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: '#FFFFFF'
              }}
            />
          ),
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: navigation.isFocused() ? '#009099' : 'transparent',
            marginHorizontal: 0,
            borderRadius: 0,
            paddingVertical: 8,
            borderRightWidth: 1,
            borderRightColor: '#2C3A4B',
          }
        })}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={({ route, navigation }) => ({
          tabBarLabel: 'History',
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="history"
              size={24}
              color="#FFFFFF"
            />
          ),
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: navigation.isFocused() ? '#009099' : 'transparent',
            marginHorizontal: 0,
            borderRadius: 0,
            paddingVertical: 8,
            borderRightWidth: 1,
            borderRightColor: '#2C3A4B',
          }
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={Notifications}
        options={({ route, navigation }) => ({
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="bell"
              size={24}
              color="#FFFFFF"
            />
          ),
          ...(unreadCount > 0 ? {
            tabBarBadge: unreadCount,
            tabBarBadgeStyle: {
              backgroundColor: '#FF0000',
              color: 'white',
            },
          } : {}),
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: navigation.isFocused() ? '#009099' : 'transparent',
            marginHorizontal: 0,
            borderRadius: 0,
            paddingVertical: 8,
            borderRightWidth: 1,
            borderRightColor: '#2C3A4B',
          }
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={({ route, navigation }) => ({
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="user"
              size={24}
              color="#FFFFFF"
            />
          ),
          tabBarItemStyle: {
            flex: 1,
            backgroundColor: navigation.isFocused() ? '#009099' : 'transparent',
            marginHorizontal: 0,
            borderRadius: 0,
            paddingVertical: 8,
            borderRightWidth: 0,
          }
        })}
      />
    </Tab.Navigator>
  );
};

export default Main;
