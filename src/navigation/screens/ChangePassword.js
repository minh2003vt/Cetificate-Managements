import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ImageBackground,
  Alert,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changePassword } from '../../services/api';

const ChangePassword = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { width, height } = useWindowDimensions();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (key, value, allValues) => {
    switch (key) {
      case 'currentPassword':
        return !value.trim() ? 'Please enter your current password' : '';
      
      case 'newPassword':
        if (!value.trim()) return 'Please enter your new password';
        if (value.length < 8) return 'New password must be at least 8 characters';
        if (value.trim() === allValues.currentPassword.trim()) {
          return 'New password and current password cant be the same';
        }
        return '';
      
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your new password';
        if (value.trim() !== allValues.newPassword.trim()) {
          return 'New password and confirm password do not match';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleFieldChange = (key, value) => {
    const newPasswordData = {
      ...passwordData,
      [key]: value
    };
    
    setPasswordData(newPasswordData);

    // Validate the changed field
    const fieldError = validateField(key, value, newPasswordData);
    
    // For confirmPassword, also revalidate newPassword
    if (key === 'newPassword') {
      const confirmError = validateField('confirmPassword', newPasswordData.confirmPassword, newPasswordData);
      setErrors(prev => ({
        ...prev,
        [key]: fieldError,
        confirmPassword: confirmError
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [key]: fieldError
      }));
    }
  };

  const handleUpdatePassword = async () => {
    try {
      // Validate all fields
      const currentPasswordError = validateField('currentPassword', passwordData.currentPassword, passwordData);
      const newPasswordError = validateField('newPassword', passwordData.newPassword, passwordData);
      const confirmPasswordError = validateField('confirmPassword', passwordData.confirmPassword, passwordData);

      const newErrors = {
        currentPassword: currentPasswordError,
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError
      };

      setErrors(newErrors);

      if (currentPasswordError || newPasswordError || confirmPasswordError) {
        return;
      }

      setLoading(true);

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');

      if (!userId || !token) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const response = await changePassword(userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, token);
      
      console.log('Password update response:', response);
      Alert.alert('Success', 'Password changed successfully');
      
      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Navigate back to settings
      navigation.goBack();
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors(prev => ({...prev, currentPassword: error.message || 'Failed to change password'}));
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (label, key, showPassword, setShowPassword) => {
    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input, 
              { 
                borderBottomColor: errors[key] ? 'red' : theme.border,
                color: theme.text,
                flex: 1,
              }
            ]}
            value={passwordData[key]}
            onChangeText={(text) => handleFieldChange(key, text)}
            secureTextEntry={!showPassword}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={theme.textSecondary}
          />
          <TouchableOpacity 
            style={styles.showPasswordButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <FontAwesome 
              name={showPassword ? "eye-slash" : "eye"} 
              size={20} 
              color={theme.text} 
            />
          </TouchableOpacity>
        </View>
        {errors[key] ? (
          <Text style={[styles.errorText, { color: 'red' }]}>{errors[key]}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <ImageBackground 
      source={isDarkMode 
        ? require("../../../assets/Background-Dark.png")
        : require("../../../assets/Background-homepage.png")
      }
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ color: theme.textUpper }}>
            <FontAwesome name="arrow-left" size={24} style={{ color: theme.textUpper }}/>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textUpper }]}>Change Password</Text>
          <View style={{ width: 24 }}></View> {/* Empty view for balance */}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Updating password...</Text>
          </View>
        ) : (
            <ScrollView contentContainerStyle={[styles.contentContainer]}>
            <View style={[styles.card, { backgroundColor: theme.contentInfo }]}>
            <View style={styles.infoContainer}>
                {renderPasswordField("Current Password", "currentPassword", showCurrentPassword, setShowCurrentPassword)}
                {renderPasswordField("New Password", "newPassword", showNewPassword, setShowNewPassword)}
                {renderPasswordField("Confirm Password", "confirmPassword", showConfirmPassword, setShowConfirmPassword)}
                </View>
                <TouchableOpacity 
                  style={[styles.updateButton, { backgroundColor: theme.primary }]} 
                  onPress={handleUpdatePassword}
                >
                  <Text style={styles.updateButtonText}>Update Password</Text>
                </TouchableOpacity>
            </View>
          </ScrollView>
       
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
    paddingBottom: 40,
    minHeight: '100%',
    marginTop: 30, 
  },
  formContainer: {
    width: '100%',
    paddingTop: 20,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  showPasswordButton: {
    padding: 8,
  },
  updateButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default ChangePassword; 