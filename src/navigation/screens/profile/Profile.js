import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ImageBackground,
  Alert,
  Platform,
  Modal,
  SafeAreaView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import ImageZoom from 'react-native-image-pan-zoom';
import { useTheme } from '../../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateUserProfile, changePassword, updateUserAvatar, getUserAvatar } from '../../../services/api';
import { BACKGROUND_HOMEPAGE, BACKGROUND_DARK,DEFAULT_AVATAR} from '../../../utils/assets';
const Profile = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { width, height } = useWindowDimensions();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile tab states
  const [profileData, setProfileData] = useState({
    fullName: "",
    gender: "Male",
    dateOfBirth: new Date().toISOString().split('T')[0],
    address: "",
    email: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  // Password tab states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gender options
  const genderOptions = ["Male", "Female", "Other"];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const userToken = await AsyncStorage.getItem("userToken");

      if (!userId || !userToken) {
        Alert.alert("Error", "Please login again");
        navigation.navigate("Login");
        return;
      }

      setLoading(true);
      
      // Tải thông tin hồ sơ
      const userData = await getUserProfile(userId, userToken);

      if (userData) {
        // Format date to YYYY-MM-DD
        const dateOfBirth = userData.dateOfBirth 
          ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        const profileData = {
          fullName: userData.fullName || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          address: userData.address || "",
          gender: userData.gender || "Male",
          dateOfBirth: dateOfBirth,
        };

        setProfileData(profileData);

        // Update AsyncStorage with latest data
        await AsyncStorage.setItem("userFullName", profileData.fullName);
        await AsyncStorage.setItem("userEmail", profileData.email);
        await AsyncStorage.setItem("userPhone", profileData.phoneNumber);
        await AsyncStorage.setItem("userAddress", profileData.address);
        await AsyncStorage.setItem("userGender", profileData.gender);
        await AsyncStorage.setItem("userDateOfBirth", dateOfBirth);
        
        // Lấy và lưu trữ URL avatar
        if (userData.avatarUrlWithSas) {
          setProfileImage(userData.avatarUrlWithSas);
          await AsyncStorage.setItem("userAvatar", userData.avatarUrlWithSas);
        } 
        Alert.alert("Error", "No profile data received");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", error.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setLoading(true);
        
        // Lấy userId và token để gọi API
        const userId = await AsyncStorage.getItem("userId");
        const token = await AsyncStorage.getItem("userToken");
        
        if (!userId || !token) {
          Alert.alert("Lỗi", "Bạn cần đăng nhập lại");
          navigation.navigate("Login");
          return;
        }
        
        try {
          // Tải ảnh lên server
          await updateUserAvatar(userId, selectedAsset.uri, token);
          
          // Làm mới thông tin profile để lấy URL avatar mới
          await loadUserProfile();
          
          // Hiển thị thông báo thành công
          Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật");
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện. Vui lòng thử lại.");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const validateField = (key, value) => {
    switch (key) {
      case 'fullName':
        if (!value || value.trim() === '') {
          return 'Please enter your full name';
        }
        if (value.length > 50) {
          return 'Full name cannot exceed 50 characters';
        }
        return '';

      case 'email':
        if (value && !/@/.test(value)) {
          return 'Invalid email format, must contain @ character';
        }
        return '';

      case 'phoneNumber':
        if (value && !/^\d{10}$/.test(value)) {
          return 'Phone number must be exactly 10 digits';
        }
        return '';

      default:
        return '';
    }
  };

  const handleFieldChange = (key, value) => {
    // Kiểm tra nếu là trường phoneNumber thì chỉ cho phép nhập số
    if (key === 'phoneNumber') {
      // Chỉ cho phép các ký tự số
      if (!/^\d*$/.test(value)) {
        return;
      }
    }

    const newProfileData = {
      ...profileData,
      [key]: value
    };
    
    setProfileData(newProfileData);

    // Validate the changed field
    const fieldError = validateField(key, value);
    setErrors(prev => ({
      ...prev,
      [key]: fieldError
    }));
  };

  const handleSave = async () => {
    try {
      // Validate all fields
      const fullNameError = validateField('fullName', profileData.fullName);
      const emailError = validateField('email', profileData.email);
      const phoneError = validateField('phoneNumber', profileData.phoneNumber);

      const newErrors = {
        fullName: fullNameError,
        email: emailError,
        phoneNumber: phoneError,
      };

      setErrors(newErrors);

      if (fullNameError || emailError || phoneError) {
        return;
      }

      // Validate dateOfBirth
      const birthDate = new Date(profileData.dateOfBirth);
      const now = new Date();
      if (birthDate > now) {
        setErrors(prev => ({
          ...prev,
          dateOfBirth: 'Date of birth cannot be in the future'
        }));
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

      const response = await updateUserProfile(userId, profileData, token);
      
      Alert.alert('Success', response.message || 'Profile updated successfully');
      setIsEditing(false);
      // Reload profile data
      await loadUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setProfileData(prev => ({
        ...prev,
        dateOfBirth: selectedDate.toISOString().split('T')[0]
      }));
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = ('' + phone).replace(/\D/g, '');
    return cleaned;
  };

  const renderField = (label, value, key) => {
    if (key === 'gender') {
      return (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          {isEditing ? (
            <>
              <TouchableOpacity 
                style={[styles.dropdownButton, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
              >
                <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                  {value || "Select Gender"}
                </Text>
              </TouchableOpacity>
              
              {showGenderDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: theme.contentInfo }]}>
                {genderOptions.map((option) => (
                    <TouchableOpacity
                    key={option} 
                      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                      onPress={() => {
                        setProfileData(prev => ({ ...prev, gender: option }));
                        setShowGenderDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </View>
              )}
            </>
          ) : (
            <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
          )}
        </View>
      );
    }

    if (key === 'dateOfBirth') {
      return (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          {isEditing ? (
            <>
            <TouchableOpacity 
                style={[styles.dateSelector, { borderBottomColor: errors[key] ? 'red' : theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
              <FontAwesome name="calendar" size={16} color={theme.text} />
            </TouchableOpacity>
              {errors[key] ? (
                <Text style={[styles.errorText, { color: 'red' }]}>{errors[key]}</Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
          )}
        </View>
      );
    }

    if (key === 'phoneNumber') {
      return (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          <View style={styles.phoneContainer}>
            {isEditing ? (
              <>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      borderBottomColor: errors[key] ? 'red' : theme.border,
                      color: theme.text,
                      flex: 1,
                    }
                  ]}
                  value={value}
                  onChangeText={(text) => handleFieldChange(key, text)}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.textSecondary}
                />
                {errors[key] ? (
                  <Text style={[styles.errorText, { color: 'red' }]}>{errors[key]}</Text>
                ) : null}
              </>
            ) : (
              <>
            <Text style={[styles.value, { color: theme.text }]}>{formatPhoneNumber(value)}</Text>
            <TouchableOpacity 
              style={styles.showPhoneButton}
              onPress={() => setShowFullPhone(!showFullPhone)}
            >
              <FontAwesome 
                name={showFullPhone ? "eye-slash" : "eye"} 
                size={20} 
                color={theme.text} 
              />
            </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        {isEditing ? (
          <>
          <TextInput
            style={[
              styles.input, 
              { 
                  borderBottomColor: errors[key] ? 'red' : theme.border,
                color: theme.text,
              }
            ]}
            value={value}
              onChangeText={(text) => handleFieldChange(key, text)}
            placeholderTextColor={theme.textSecondary}
          />
            {errors[key] ? (
              <Text style={[styles.errorText, { color: 'red' }]}>{errors[key]}</Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        )}
      </View>
    );
  };

  // Hàm xử lý đổi mật khẩu
  const validatePasswordField = (key, value, allValues) => {
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

  const handlePasswordFieldChange = (key, value) => {
    const newPasswordData = {
      ...passwordData,
      [key]: value
    };
    
    setPasswordData(newPasswordData);

    // Validate the changed field
    const fieldError = validatePasswordField(key, value, newPasswordData);
    
    // For confirmPassword, also revalidate newPassword
    if (key === 'newPassword') {
      const confirmError = validatePasswordField('confirmPassword', newPasswordData.confirmPassword, newPasswordData);
      setPasswordErrors(prev => ({
        ...prev,
        [key]: fieldError,
        confirmPassword: confirmError
      }));
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        [key]: fieldError
      }));
    }
  };

  const handleUpdatePassword = async () => {
    try {
      // Validate all fields
      const currentPasswordError = validatePasswordField('currentPassword', passwordData.currentPassword, passwordData);
      const newPasswordError = validatePasswordField('newPassword', passwordData.newPassword, passwordData);
      const confirmPasswordError = validatePasswordField('confirmPassword', passwordData.confirmPassword, passwordData);

      const newErrors = {
        currentPassword: currentPasswordError,
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError
      };

      setPasswordErrors(newErrors);

      if (currentPasswordError || newPasswordError || confirmPasswordError) {
        return;
      }

      setPasswordLoading(true);

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
      Alert.alert('Success', response.message || 'Password changed successfully');
      
      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors(prev => ({...prev, currentPassword: error.message || 'Failed to change password'}));
    } finally {
      setPasswordLoading(false);
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
                borderBottomColor: passwordErrors[key] ? 'red' : theme.border,
                color: theme.text,
                flex: 1,
              }
            ]}
            value={passwordData[key]}
            onChangeText={(text) => handlePasswordFieldChange(key, text)}
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
        {passwordErrors[key] ? (
          <Text style={[styles.errorText, { color: 'red' }]}>{passwordErrors[key]}</Text>
        ) : null}
      </View>
    );
  };

  // Hàm đăng xuất
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
              // Xóa tất cả dữ liệu đăng nhập
              await AsyncStorage.clear();

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

  const DatePickerComponent = ({ visible, onClose, value, onChange, theme }) => {
    return Platform.select({
      ios: (
        <Modal
          transparent={true}
          visible={visible}
          animationType="slide"
        >
          <View style={[styles.datePickerContainer, { backgroundColor: theme.modalBackground }]}>
            <View style={[styles.datePickerHeader, { backgroundColor: theme.cardSolid }]}>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  onChange(null, new Date(value));
                  onClose();
                }}
              >
                <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={new Date(value)}
              mode="date"
              display="spinner"
              onChange={onChange}
              maximumDate={new Date()}
              style={[styles.datePicker, { backgroundColor: theme.cardSolid }]}
              textColor={theme.text}
            />
          </View>
        </Modal>
      ),
      android: (
        visible && (
          <DateTimePicker
            value={new Date(value)}
            mode="date"
            display="default"
            onChange={onChange}
            maximumDate={new Date()}
            textColor={theme.text}
          />
        )
      )
    });
  };

  return (
    <ImageBackground 
      source={BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ color: theme.textUpper }}>
            </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textUpper }]}>Profile</Text>
          {activeTab === 'profile' && (
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ color: theme.textUpper }}>
              <FontAwesome name={isEditing ? "check" : "edit"} size={24} style={{ color: theme.textUpper }} />
            </TouchableOpacity>
          )}
          {activeTab === 'password' && (
            <View style={{ width: 24 }}></View>
          )}
        </View>

        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            <Image
              source={profileImage ? { uri: profileImage } : DEFAULT_AVATAR}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.changePhotoButton, { backgroundColor: theme.primary }]} 
            onPress={handleImagePicker}
          >
            <FontAwesome name="camera" size={20} color="white" />
            <Text style={[styles.changePhotoText, { color: 'white' }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {loading || passwordLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              {activeTab === 'profile' ? 'Loading profile...' : 'Updating password...'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[styles.contentContainer]}>
            <View style={[styles.card, { backgroundColor: theme.contentInfo }]}>
              {/* Tab selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tab, 
                    activeTab === 'profile' ? { borderBottomColor: theme.primary, borderBottomWidth: 2 } : {}
                  ]} 
                  onPress={() => setActiveTab('profile')}
                >
                  <Text style={[styles.tabText, activeTab === 'profile' ? { color: theme.primary } : { color: theme.textSecondary }]}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.tab, 
                    activeTab === 'password' ? { borderBottomColor: theme.primary, borderBottomWidth: 2 } : {}
                  ]} 
                  onPress={() => setActiveTab('password')}
                >
                  <Text style={[styles.tabText, activeTab === 'password' ? { color: theme.primary } : { color: theme.textSecondary }]}>Change Password</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'profile' && (
                <View style={styles.infoContainer}>
                  {renderField("Full Name", profileData.fullName, "fullName")}
                  {renderField("Gender", profileData.gender, "gender")}
                  {renderField("Date of Birth", profileData.dateOfBirth, "dateOfBirth")}
                  {renderField("Address", profileData.address, "address")}
                  {renderField("Email", profileData.email, "email")}
                  {renderField("Phone Number", profileData.phoneNumber, "phoneNumber")}

                  {isEditing && (
                    <TouchableOpacity 
                      style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                  )}

                  {/* Nút đăng xuất cho tab hồ sơ */}
                  <TouchableOpacity 
                    style={[styles.logoutButton, { backgroundColor: '#e74c3c' }]} 
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'password' && (
                <View style={styles.infoContainer}>
                  {renderPasswordField("Current Password", "currentPassword", showCurrentPassword, setShowCurrentPassword)}
                  {renderPasswordField("New Password", "newPassword", showNewPassword, setShowNewPassword)}
                  {renderPasswordField("Confirm Password", "confirmPassword", showConfirmPassword, setShowConfirmPassword)}
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                    onPress={handleUpdatePassword}
                  >
                    <Text style={styles.saveButtonText}>Update Password</Text>
                  </TouchableOpacity>

                  {/* Nút đăng xuất cho tab đổi mật khẩu */}
                  <TouchableOpacity 
                    style={[styles.logoutButton, { backgroundColor: '#e74c3c' }]} 
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </ScrollView>
        )}

        {/* Image Zoom Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.modalBackground }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setShowImageModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="close" size={24} color={"white"} />
              </TouchableOpacity>
            </View>
            <ImageZoom
              cropWidth={width}
              cropHeight={height * 0.8}
              imageWidth={width}
              imageHeight={width}
            >
              <Image
                source={profileImage ? { uri: profileImage } : DEFAULT_AVATAR}
                style={{
                  width: width,
                  height: width,
                }}
                contentFit="contain"
              />
            </ImageZoom>
          </View>
        </Modal>

        {/* Date Picker - Platform specific rendering */}
        {showDatePicker && (
          <DatePickerComponent
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            value={profileData.dateOfBirth}
            onChange={(event, date) => {
              if (date) {
                setProfileData(prev => ({
                  ...prev,
                  dateOfBirth: date.toISOString().split('T')[0]
                }));
              }
            }}
            theme={theme}
          />
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
    width: '100%',
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
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    gap: 10,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1D72F3',
    paddingVertical: 5,
    color: '#333',
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1D72F3',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showPhoneButton: {
    padding: 5,
  },
  pickerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1D72F3',
    marginTop: -10,
  },
  picker: {
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modalHeader: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  closeButton: {
    padding: 10,
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    height: 260,
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
  dropdownButton: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownList: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    color: 'red',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showPasswordButton: {
    padding: 5,
  },
});

export default Profile; 