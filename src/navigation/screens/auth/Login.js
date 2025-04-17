import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser, getUserProfile } from "../../../services/api";
import { FontAwesome } from '@expo/vector-icons';
import { BACKGROUND_HOMEPAGE,FLIGHT_VAULT_LOGO } from "../../../utils/assets";
const Login = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      return setErrorMessage("Please fill in all fields!");
    }

    try {
      setLoading(true);
      setErrorMessage("");
      
      const loginData = await loginUser(username, password);
      console.log("Login Response:", loginData);

      // Kiểm tra xem loginData có phải là undefined, null hoặc không có token
      if (!loginData || !loginData.token) {
        setErrorMessage("Invalid username or password!");
        setLoading(false);
        return;
      }

      // Kiểm tra role của người dùng từ mảng roles
      const userRole = loginData.roles && loginData.roles.length > 0 ? loginData.roles[0] : loginData.role;
      
      if (!userRole || !["Instructor", "Trainee","Reviewer"].includes(userRole)) {
        setErrorMessage("Unauthorized: Application only for Trainee,Instructor, or Reviewer!");
        setLoading(false);
        return;
      }

      // Lưu token và userId
      await AsyncStorage.setItem("userToken", loginData.token);
      await AsyncStorage.setItem("userId", loginData.userID);
      
      // Xác định role từ các nguồn khác nhau
      const userRoleDetermined = loginData.roles && loginData.roles.length > 0 
        ? loginData.roles[0] 
        : (loginData.role || "Unknown");
        
      await AsyncStorage.setItem("userRole", userRoleDetermined);

      // Lấy thông tin user từ API
      const userData = await getUserProfile(loginData.userID, loginData.token);
      console.log("User Profile Data:", userData);
      
      if (userData) {
        // Tạo đối tượng thông tin người dùng đầy đủ
        const userInfo = {
          userId: loginData.userID,
          token: loginData.token,
          fullName: userData.fullName || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          address: userData.address || "",
          gender: userData.gender || "",
          dateOfBirth: userData.dateOfBirth || "",
          avatarUrlWithSas: userData.avatarUrlWithSas || null,
          role: userData.role || userRoleDetermined || "Unknown"
        };
        
        // Lưu thông tin người dùng dưới dạng JSON
        await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
        console.log("Saved userInfo to AsyncStorage:", userInfo);
        
        // Vẫn giữ các mục riêng lẻ cho khả năng tương thích ngược
        await AsyncStorage.setItem("userFullName", userData.fullName || "");
        await AsyncStorage.setItem("userEmail", userData.email || "");
        await AsyncStorage.setItem("userPhone", userData.phoneNumber || "");
        await AsyncStorage.setItem("userAddress", userData.address || "");
        await AsyncStorage.setItem("userGender", userData.gender || "");
        await AsyncStorage.setItem("userDateOfBirth", userData.dateOfBirth || "");
        
        // Lưu avatar URL nếu có
        if (userData.avatarUrlWithSas) {
          console.log("Avatar URL found in profile after login:", userData.avatarUrlWithSas.substring(0, 50) + "...");
          await AsyncStorage.setItem("userAvatar", userData.avatarUrlWithSas);
        } else {
          console.log("No avatar URL in profile after login");
        }
        
        // Lưu vai trò người dùng từ userData nếu có (ưu tiên hơn từ loginData)
        if (userData.role) {
          await AsyncStorage.setItem("userRole", userData.role);
        }
      }

      navigation.replace("Main");
    } catch (error) {
      console.error("Login Error:", error);
      if (typeof error === 'string') {
        setErrorMessage(error);
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Something went wrong. Please try again!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Image
            source={FLIGHT_VAULT_LOGO}
            style={[styles.logo, { width: width * 0.7, height: height * 0.3 }]}
            resizeMode="contain"
          />
          
          <View style={styles.formContainer}>
            <Text style={[styles.title, { fontSize: width * 0.08 }]}>Login</Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#1D242E"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrorMessage("");
              }}
              editable={!loading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#1D242E"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage("");
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              {isPasswordFocused && (
                <TouchableOpacity 
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <FontAwesome 
                    name={showPassword ? "eye-slash" : "eye"} 
                    size={20} 
                    color="#1D242E" 
                  />
                </TouchableOpacity>
              )}
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#283342",
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    alignItems: "center",
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#1D72F3",
    width: "60%",
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 15,
    padding: 10,
  },
});

export default Login;
