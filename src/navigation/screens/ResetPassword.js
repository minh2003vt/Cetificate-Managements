import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, useWindowDimensions, Alert, ImageBackground } from "react-native";
import { resetPassword } from "../../services/api";

const ResetPassword = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = route.params;

  const validateNewPassword = (password) => {
    if (!password.trim()) {
      setNewPasswordError("Password is required");
      return false;
    } else if (password.length < 6) {
      setNewPasswordError("Password must be at least 6 characters long");
      return false;
    } else {
      setNewPasswordError("");
      return true;
    }
  };

  const validateConfirmPassword = (confirmPass) => {
    if (!confirmPass.trim()) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    } else if (confirmPass !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    } else {
      setConfirmPasswordError("");
      return true;
    }
  };

  const handleResetPassword = async () => {
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      const response = await resetPassword(token, newPassword);
      
      if (response) {
        Alert.alert(
          "Success",
          "Your password has been reset successfully!",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
      }
    } catch (error) {
      console.error("Reset Password Error:", error);
      setNewPasswordError(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={require("../../../assets/flightvault-logo.png")}
          style={[styles.logo, { width: width * 0.7, height: height * 0.3 }]}
          resizeMode="contain"
        />

        <Text style={[styles.title, { fontSize: width * 0.08 }]}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, newPasswordError ? styles.inputError : null]}
            placeholder="New Password"
            placeholderTextColor="#1D242E"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              validateNewPassword(text);
              if (confirmPassword) {
                validateConfirmPassword(confirmPassword);
              }
            }}
            secureTextEntry
            editable={!loading}
          />
          {newPasswordError ? (
            <Text style={styles.errorText}>{newPasswordError}</Text>
          ) : null}

          <TextInput
            style={[styles.input, confirmPasswordError ? styles.inputError : null]}
            placeholder="Confirm Password"
            placeholderTextColor="#1D242E"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              validateConfirmPassword(text);
            }}
            secureTextEntry
            editable={!loading}
          />
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.resetButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.resetButtonText}>
            {loading ? "Resetting..." : "Reset Password"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 30,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 5,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "red",
  },
  resetButton: {
    backgroundColor: "#1D72F3",
    width: "60%",
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 15,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 5,
  },
});

export default ResetPassword; 