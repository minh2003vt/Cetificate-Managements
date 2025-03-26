import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { loginUser, getUserProfile } from "../../services/api";

const Login = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [UserName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!UserName.trim() || !password.trim()) {
      return setErrorMessage("Please fill in all fields!");
    }

    try {
      setLoading(true);
      const loginData = await loginUser(UserName, password);
      console.log("Login Response:", loginData);

      if (loginData) {
        // Lưu token và userId
        await AsyncStorage.setItem("userToken", loginData.token);
        await AsyncStorage.setItem("userId", loginData.userID);

        // Lấy thông tin user từ API
        const userData = await getUserProfile(loginData.userID, loginData.token);
        if (userData) {
          // Lưu fullName vào storage
          await AsyncStorage.setItem("userFullName", userData.fullName || "");
        }

        navigation.replace("Main");
      } else {
        setErrorMessage("Login failed!");
      }
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
    <View style={styles.container}>
      <Image
        source={require("../../../assets/flightvault-logo.png")}
        style={[styles.logo, { width: width * 0.7, height: height * 0.3 }]}
        resizeMode="contain"
      />
      <Text style={[styles.title, { fontSize: width * 0.08 }]}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="User Name"
        placeholderTextColor="#1D242E"
        value={UserName}
        onChangeText={setUserName}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#1D242E"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TouchableOpacity 
        style={[
          styles.loginButton, 
          { width: width * 0.7, opacity: loading ? 0.7 : 1 }
        ]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={[styles.loginButtonText, { fontSize: width * 0.05 }]}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={[styles.forgotPassword, { fontSize: width * 0.04 }]}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#283342",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#1D72F3",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
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
  forgotPassword: {
    color: "#ffff",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 10,
  },
});

export default Login;
