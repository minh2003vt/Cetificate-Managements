import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, ImageBackground, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from '@expo/vector-icons';

export default function Settings() {
  const navigation = useNavigation(); // Hook để điều hướng
  const { height } = Dimensions.get("window");

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
    <ImageBackground 
      source={require("../../../assets/Background-homepage.png")} 
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          <View style={styles.profileContainer}>
            <Image source={require("../../../assets/default-avatar.png")} style={styles.avatar} />
            <Text style={styles.name}>Minh Pham</Text>
            <Text style={styles.userId}>ID: 21747</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option}>
              <FontAwesome name="user" size={24} color="black" />
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Account center</Text>
                <Text style={styles.optionSubtitle}>Password, security, personal information, options</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <FontAwesome name="globe" size={24} color="black" />
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Language</Text>
                <Text style={styles.optionSubtitle}>(Set the zone address)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <FontAwesome name="cog" size={24} color="black" />
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Appearance Settings</Text>
                <Text style={styles.optionSubtitle}>Dark mode/Light mode, font size</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <FontAwesome name="certificate" size={24} color="black" />
              <View style={styles.textContainer}>
                <Text style={styles.optionTitle}>Certificate Management</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent', 
    padding: 20,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  
  profileContainer: { 
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },

  name: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: 'white',
    marginTop: 10,
  },

  userId: { 
    fontSize: 16, 
    color: '#ddd' 
  },

  scrollContent: { 
    paddingBottom: 20,
  },

  optionsContainer: { 
    padding: 10,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
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
    color: 'black' 
  },

  optionSubtitle: { 
    fontSize: 12, 
    color: '#555' 
  },

  logoutButton: {
    backgroundColor: '#e74c3c',
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
