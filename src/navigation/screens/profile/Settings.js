import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import {DEFAULT_AVATAR } from '../../../utils/assets';

export default function Settings() {
  const navigation = useNavigation(); // Hook để điều hướng
  const { height } = Dimensions.get("window");
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const [name, id] = await Promise.all([
          AsyncStorage.getItem("userFullName"),
          AsyncStorage.getItem("userId")
        ]);
        setFullName(name || "User");
        setUserId(id || "");
      } catch (error) {
        console.error("Error loading user info:", error);
        setFullName("User");
        setUserId("");
      }
    };
    
    loadUserInfo();
  }, []);

  // Hàm logout
  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Starting logout process...");
              
              // Lấy token hiện tại để kiểm tra
              const currentToken = await AsyncStorage.getItem("token");
              const currentUserId = await AsyncStorage.getItem("userId");
              console.log("Current token:", currentToken);
              console.log("Current userId:", currentUserId);

              // Xóa tất cả dữ liệu đăng nhập
              await AsyncStorage.clear();
              console.log("AsyncStorage cleared");

              // Chuyển hướng về màn hình Login ngay lập tức
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              
              // Hiển thị thông báo thành công
              Alert.alert(
                "Logged Out",
                "You have been logged out successfully."
              );
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert(
                "Error",
                "An error occurred while logging out. Please try again."
              );
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  return (

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.container}>
          <View style={styles.profileContainer}>
            <Image source={DEFAULT_AVATAR} style={styles.avatar} />
            <Text style={[styles.name, { color: theme.textUpper }]}>{fullName}</Text>
            <Text style={[styles.userId, { color: theme.textSecondary }]}>ID: {userId}</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.option, { backgroundColor: theme.card }]} 
              onPress={() => navigation.navigate('Profile')}
            >
              <FontAwesome name="user" size={24} color={theme.text} />
              <View style={styles.textContainer}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Account center</Text>
                <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                  Password, security, personal information, options
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.option, { backgroundColor: theme.card }]} 
              onPress={toggleTheme}
            >
              <FontAwesome name={isDarkMode ? "moon-o" : "sun-o"} size={24} color={theme.text} />
              <View style={styles.textContainer}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Appearance Settings</Text>
                <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                  {isDarkMode ? 'Dark mode enabled' : 'Light mode enabled'}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.option, { backgroundColor: theme.card }]} 
              onPress={() => navigation.navigate('CertificateManagement')}
            >
              <FontAwesome name="certificate" size={24} color={theme.text} />
              <View style={styles.textContainer}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Certificate Management</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.accent }]} 
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: { 
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  scrollContent: { 
    flexGrow: 1,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  profileContainer: { 
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: { 
    fontSize: 22, 
    fontWeight: 'bold',
    marginTop: 10,
  },
  userId: { 
    fontSize: 16,
  },
  optionsContainer: { 
    padding: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  textContainer: { 
    marginLeft: 10, 
    flex: 1 
  },
  optionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold',
  },
  optionSubtitle: { 
    fontSize: 12,
  },
  logoutButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'white' 
  },
});
