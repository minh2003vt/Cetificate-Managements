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
  Keyboard,
  Alert
} from "react-native";
import { forgotPassword } from "../../services/api";

const ForgotPassword = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    // Validate email
    if (!email.trim()) {
      return setErrorMessage("Please enter your email!");
    }

    try {
      setLoading(true);
      const response = await forgotPassword(email);
      
      if (response) {
        Alert.alert(
          "Success",
          "A change password email has been sent to you, please check it",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      setErrorMessage(error.message || "Failed to send reset password email");
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
            source={require("../../../assets/flightvault-logo.png")}
            style={[styles.logo, { width: width * 0.7, height: height * 0.3 }]}
            resizeMode="contain"
          />
          
          <View style={styles.formContainer}>
            <Text style={[styles.title, { fontSize: width * 0.08 }]}>Forgot Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#1D242E"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Validate email length
                if (text.length > 60) {
                  setErrorMessage("Email cannot exceed 60 characters!");
                } else if (text.length > 0 && !text.includes('@')) {
                  setErrorMessage("Invalid email format, must contain @ character!");
                } else {
                  setErrorMessage("");
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.sendButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleSendEmail}
              disabled={loading || !!errorMessage}
            >
              <Text style={styles.sendButtonText}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
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
    marginBottom: 15,
  },
  sendButton: {
    backgroundColor: "#1D72F3",
    width: "60%",
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  sendButtonText: {
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
    fontSize: 16,
    marginBottom: 10,
  },
});

export default ForgotPassword; 