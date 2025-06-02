import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Import Stack Navigator
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@react-navigation/native';
import { Image, Text, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnreadCount } from '../services/api';
import { EventRegister } from 'react-native-event-listeners';

// Import các component từ thư mục mới thông qua index.js
import { Home, Schedule, ImportScore, SubjectList, SubjectDetail } from '../../src/navigation/screens/home';
import { Notifications } from '../../src/navigation/screens/notifications';
import { History, Certificate } from '../../src/navigation/screens/history';
import { Courses, CourseDetail, TrainingPlan, TrainingPlanDetail } from '../../src/navigation/screens/training';
import { Grade, ViewGrade } from '../../src/navigation/screens/grade';
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
      <Stack.Screen
        name="Grade"
        component={Grade}
        options={{ headerShown: false }} // Hide the header in Grade screen
      />
      <Stack.Screen
        name="ViewGrade"
        component={ViewGrade}
        options={{ headerShown: false }} // Hide the header in ViewGrade screen
      />
      <Stack.Screen
        name="ImportScore"
        component={ImportScore}
        options={{ headerShown: false }} // Hide the header in ImportScore screen
      />
      <Stack.Screen
        name="SubjectList"
        component={SubjectList}
        options={{ headerShown: false }} // Hide the header in SubjectList screen
      />
      <Stack.Screen
        name="SubjectDetail"
        component={SubjectDetail}
        options={{ headerShown: false }} // Hide the header in SubjectDetail screen
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ headerShown: false }} // Hide the header in Notifications screen
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

// Stack Navigator for Grade
function GradeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Grade"
        component={Grade}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const Main = () => {
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [showAllTabs, setShowAllTabs] = useState(true);

  // Hàm kiểm tra các key trong AsyncStorage để debug
  const checkAllStorageKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Error checking AsyncStorage:', error);
    }
  };

  // Lấy thông tin vai trò người dùng từ AsyncStorage
  const getUserRole = async () => {
    try {
      // Kiểm tra tất cả các key trước
      await checkAllStorageKeys();
      
      // Thử lấy từ userInfo
      const userInfo = await AsyncStorage.getItem('userInfo');
      
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          
          if (parsedInfo.role) {
            setUserRole(parsedInfo.role);
          }
        } catch (parseError) {
          console.error('Error parsing userInfo:', parseError);
        }
      }
      
      // Thử lấy trực tiếp từ userRole key (nếu có)
      const directRole = await AsyncStorage.getItem('userRole');
      if (directRole) {
        setUserRole(directRole);
      }
      // Cập nhật trạng thái hiển thị tab dựa trên vai trò
      updateTabVisibility();
    } catch (error) {
      console.error('Error getting user role:', error);
    }
  };

  // Cập nhật trạng thái hiển thị tab dựa trên vai trò
  const updateTabVisibility = () => {
    const lowerRole = userRole.toLowerCase();
    const isInstructorRole = lowerRole.includes('instructor') || 
                             lowerRole === 'trainer';
        
    setShowAllTabs(!isInstructorRole);
  };

  const loadUnreadCount = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      if (userId && token) {
        const response = await getUnreadCount(userId, token);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    // Lấy thông tin vai trò người dùng khi component mount
    getUserRole();
    
    // Khởi tạo số lượng thông báo khi component mount
    loadUnreadCount();
    
    // Đăng ký các listeners cho các sự kiện khác nhau
    const unreadCountListener = EventRegister.addEventListener(
      'updateNotificationCount',
      (data) => {
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

    // Lắng nghe sự kiện đăng nhập để cập nhật role
    const loginListener = EventRegister.addEventListener(
      'userLoggedIn',
      (data) => {
        // Đợi 1 giây để đảm bảo AsyncStorage đã được cập nhật
        setTimeout(() => {
          getUserRole();
        }, 1000);
      }
    );

    // Cleanup function
    return () => {
      EventRegister.removeEventListener(unreadCountListener);
      EventRegister.removeEventListener(newNotificationListener);
      EventRegister.removeEventListener(notificationReadListener);
      EventRegister.removeEventListener(loginListener);
    };
  }, []);

  // Cập nhật hiển thị tab khi userRole thay đổi
  useEffect(() => {
    updateTabVisibility();
  }, [userRole]);

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
      
      {showAllTabs && (
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
      )}
      
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
