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
import ImageZoom from 'react-native-image-pan-zoom';
import { useTheme } from '../../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateUserProfile, changePassword, updateUserAvatar } from '../../../services/api';
import { BACKGROUND_HOMEPAGE, BACKGROUND_DARK, DEFAULT_AVATAR } from '../../../utils/assets';

// Component nhỏ: Avatar
const ProfileAvatar = ({ profileImage, handleImagePicker, setShowImageModal }) => (
  <View style={styles.profileImageContainer}>
    <TouchableOpacity onPress={() => setShowImageModal(true)}>
      <Image
        source={profileImage ? { uri: profileImage } : DEFAULT_AVATAR}
        style={styles.profileImage}
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.editImageButton}
      onPress={handleImagePicker}
    >
      <FontAwesome name="camera" size={20} color="white" />
    </TouchableOpacity>
  </View>
);

// Component nhỏ: Input Field
const ProfileField = ({ label, value, editable, error, onChangeText, isPassword, showPassword, togglePassword, keyboardType, isTextArea }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={[
          styles.fieldInput,
          isTextArea && { height: 100, textAlignVertical: 'top' },
          error ? styles.errorInput : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={isPassword && !showPassword}
        keyboardType={keyboardType || 'default'}
        multiline={isTextArea}
        numberOfLines={isTextArea ? 4 : 1}
      />
      {isPassword && (
        <TouchableOpacity style={styles.eyeIcon} onPress={togglePassword}>
          <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#888" />
        </TouchableOpacity>
      )}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// Component nhỏ: Tab thông tin cá nhân
const ProfileTab = ({ 
  profileData, errors, isEditing, setIsEditing, 
  handleFieldChange, handleSave, showDatePicker, setShowDatePicker, 
  handleDateChange, showGenderDropdown, setShowGenderDropdown, 
  genderOptions
}) => (
  <View style={styles.tabContent}>
    <ProfileField
      label="Full Name"
      value={profileData.fullName}
      editable={isEditing}
      error={errors.fullName}
      onChangeText={(value) => handleFieldChange('fullName', value)}
    />
    {/* Giới tính */}
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Gender</Text>
      {isEditing ? (
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowGenderDropdown(!showGenderDropdown)}
        >
              <Text>{profileData.gender || "Select Gender"}</Text>
          <FontAwesome name="caret-down" size={16} color="#666" />
        </TouchableOpacity>
      ) : (
        <Text style={styles.fieldValue}>{profileData.gender}</Text>
      )}
      {showGenderDropdown && (
        <View style={styles.genderDropdown}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.genderOption}
              onPress={() => {
                handleFieldChange('gender', option);
                setShowGenderDropdown(false);
              }}
            >
              <Text style={styles.genderOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
    {/* Ngày sinh */}
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>Date of Birth</Text>
      {isEditing ? (
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{profileData.dateOfBirth}</Text>
          <FontAwesome name="calendar" size={16} color="#666" />
        </TouchableOpacity>
      ) : (
        <Text style={styles.fieldValue}>{profileData.dateOfBirth}</Text>
      )}
    </View>
    {/* Email */}
    <ProfileField
      label="Email"
      value={profileData.email}
      editable={isEditing}
      error={errors.email}
      onChangeText={(value) => handleFieldChange('email', value)}
      keyboardType="email-address"
    />
    {/* Số điện thoại */}
    <ProfileField
      label="Phone Number"
      value={profileData.phoneNumber}
      editable={isEditing}
      error={errors.phoneNumber}
      onChangeText={(value) => handleFieldChange('phoneNumber', value)}
      keyboardType="phone-pad"
    />
    {/* Địa chỉ */}
    <ProfileField
      label="Address"
      value={profileData.address}
      editable={isEditing}
      error={errors.address}
      onChangeText={(value) => handleFieldChange('address', value)}
      isTextArea={true}
    />
    {/* Nút lưu/chỉnh sửa */}
    <TouchableOpacity
      style={[styles.saveButton, { backgroundColor: isEditing ? "#4CAF50" : "#2196F3" }]}
      onPress={isEditing ? handleSave : () => setIsEditing(true)}
    >
      <Text style={styles.saveButtonText}>
        {isEditing ? "Save Information" : "Edit"}
      </Text>
    </TouchableOpacity>
  </View>
);

// Component nhỏ: Tab đổi mật khẩu
const PasswordTab = ({ 
  passwordData, passwordErrors, passwordLoading, 
  handlePasswordFieldChange, handleUpdatePassword, 
  showCurrentPassword, setShowCurrentPassword,
  showNewPassword, setShowNewPassword,
  showConfirmPassword, setShowConfirmPassword
}) => (
  <View style={styles.tabContent}>
    <ProfileField
      label="Current Password"
      value={passwordData.currentPassword}
      editable={true}
      error={passwordErrors.currentPassword}
      onChangeText={(value) => handlePasswordFieldChange('currentPassword', value)}
      isPassword={true}
      showPassword={showCurrentPassword}
      togglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
    />
    <ProfileField
      label="New Password"
      value={passwordData.newPassword}
      editable={true}
      error={passwordErrors.newPassword}
      onChangeText={(value) => handlePasswordFieldChange('newPassword', value)}
      isPassword={true}
      showPassword={showNewPassword}
      togglePassword={() => setShowNewPassword(!showNewPassword)}
    />
    <ProfileField
      label="Confirm New Password"
      value={passwordData.confirmPassword}
      editable={true}
      error={passwordErrors.confirmPassword}
      onChangeText={(value) => handlePasswordFieldChange('confirmPassword', value)}
      isPassword={true}
      showPassword={showConfirmPassword}
      togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
    />
    <TouchableOpacity
      style={styles.saveButton}
      onPress={handleUpdatePassword}
      disabled={passwordLoading}
    >
      {passwordLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
          <Text style={styles.saveButtonText}>Update Password</Text>
      )}
    </TouchableOpacity>
  </View>
);

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

  // Load profile
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
      const userData = await getUserProfile(userId, userToken);
      if (userData) {
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
        await AsyncStorage.setItem("userFullName", profileData.fullName);
        await AsyncStorage.setItem("userEmail", profileData.email);
        await AsyncStorage.setItem("userPhone", profileData.phoneNumber);
        await AsyncStorage.setItem("userAddress", profileData.address);
        await AsyncStorage.setItem("userGender", profileData.gender);
        await AsyncStorage.setItem("userDateOfBirth", dateOfBirth);
        if (userData.avatarUrlWithSas) {
          setProfileImage(userData.avatarUrlWithSas);
          await AsyncStorage.setItem("userAvatar", userData.avatarUrlWithSas);
        }
      } 
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", error.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Image picker
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
        const formData = new FormData();
        formData.append('file', {
          uri: selectedAsset.uri,
          name: selectedAsset.fileName || 'avatar.jpg',
          type: selectedAsset.type ? `image/${selectedAsset.type.split('/').pop()}` : 'image/jpeg',
        });
        await updateUserAvatar(formData, token);
        await loadUserProfile();
        Alert.alert("Success", "Profile image updated successfully");
      }
    } catch (error) {
      console.error('Error in handleImagePicker or updateUserAvatar:', error);
      Alert.alert('Error', error.message || 'Cannot update profile image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate field
  const validateField = (key, value) => {
    let errorMessage = "";
    switch (key) {
      case 'fullName':
        if (!value.trim()) errorMessage = "Full Name cannot be empty";
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) errorMessage = "Email cannot be empty";
        else if (!emailRegex.test(value)) errorMessage = "Invalid email";
        break;
      case 'phoneNumber':
        const phoneRegex = /^\d{10,11}$/;
        if (value && !phoneRegex.test(value.replace(/\D/g, ''))) 
          errorMessage = "Invalid phone number";
        break;
    }
    return errorMessage;
  };

  const handleFieldChange = (key, value) => {
    setProfileData({
      ...profileData,
      [key]: value,
    });
    const errorMessage = validateField(key, value);
    setErrors({
      ...errors,
      [key]: errorMessage,
    });
  };

  const handleSave = async () => {
    const newErrors = {};
    Object.keys(profileData).forEach(key => {
      if (["fullName", "email", "phoneNumber", "address"].includes(key)) {
        newErrors[key] = validateField(key, profileData[key]);
      }
    });
      setErrors(newErrors);
    if (Object.values(newErrors).some(error => error !== "")) {
      Alert.alert("Error", "Please fix the errors before saving");
        return;
      }
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("userToken");
      if (!userId || !token) {
        Alert.alert("Error", "Please login again");
        navigation.navigate("Login");
        return;
      }
      const formattedData = {
        ...profileData,
        dateOfBirth: profileData.dateOfBirth,
      };
      await updateUserProfile(userId, formattedData, token);
      await AsyncStorage.setItem("userFullName", profileData.fullName);
      await AsyncStorage.setItem("userEmail", profileData.email);
      await AsyncStorage.setItem("userPhone", profileData.phoneNumber);
      await AsyncStorage.setItem("userAddress", profileData.address);
      await AsyncStorage.setItem("userGender", profileData.gender);
      await AsyncStorage.setItem("userDateOfBirth", profileData.dateOfBirth);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Password logic
  const validatePasswordField = (key, value, allValues) => {
    let errorMessage = "";
    switch (key) {
      case 'currentPassword':
        if (!value) errorMessage = "Mật khẩu hiện tại không được để trống";
        break;
      case 'newPassword':
        if (!value) errorMessage = "Mật khẩu mới không được để trống";
        else if (value.length < 6) errorMessage = "Mật khẩu phải có ít nhất 6 ký tự";
        else if (value === allValues.currentPassword) 
          errorMessage = "Mật khẩu mới không được giống mật khẩu cũ";
        break;
      case 'confirmPassword':
        if (!value) errorMessage = "Xác nhận mật khẩu không được để trống";
        else if (value !== allValues.newPassword) 
          errorMessage = "Xác nhận mật khẩu không khớp";
        break;
    }
    return errorMessage;
  };

  const handlePasswordFieldChange = (key, value) => {
    const newPasswordData = {
      ...passwordData,
      [key]: value,
    };
    setPasswordData(newPasswordData);
    const errorMessage = validatePasswordField(key, value, newPasswordData);
    setPasswordErrors({
      ...passwordErrors,
      [key]: errorMessage,
    });
  };

  const handleUpdatePassword = async () => {
    const newErrors = {};
    Object.keys(passwordData).forEach(key => {
      newErrors[key] = validatePasswordField(key, passwordData[key], passwordData);
    });
      setPasswordErrors(newErrors);
    if (Object.values(newErrors).some(error => error !== "")) {
      Alert.alert("Lỗi", "Vui lòng sửa các lỗi trước khi cập nhật mật khẩu");
        return;
      }
    try {
      setPasswordLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const token = await AsyncStorage.getItem("userToken");
      if (!userId || !token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        navigation.navigate("Login");
        return;
      }
      await changePassword(
        userId,
        passwordData.currentPassword,
        passwordData.newPassword,
        token
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      Alert.alert("Thành công", "Mật khẩu đã được cập nhật");
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Lỗi", error.message || "Không thể cập nhật mật khẩu");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Đăng xuất
  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Đăng xuất",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date(profileData.dateOfBirth);
    setShowDatePicker(Platform.OS === 'ios');
    handleFieldChange('dateOfBirth', currentDate.toISOString().split('T')[0]);
  };

  return (
    <ImageBackground 
      source={isDarkMode ? BACKGROUND_DARK : BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <FontAwesome name="sign-out" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0D99FF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.contentContainer}
            contentContainerStyle={styles.contentContainerStyle}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Image */}
            <ProfileAvatar 
              profileImage={profileImage}
              handleImagePicker={handleImagePicker}
              setShowImageModal={setShowImageModal}
            />
            {/* Name */}
            <Text style={styles.profileName}>{profileData.fullName}</Text>
            {/* Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[
                    styles.tab, 
                  activeTab === 'profile' ? styles.activeTab : null,
                  ]} 
                  onPress={() => setActiveTab('profile')}
                >
                <Text style={[
                  styles.tabText,
                  activeTab === 'profile' ? styles.activeTabText : null,
                ]}>
                  Personal Information
                </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.tab, 
                  activeTab === 'password' ? styles.activeTab : null,
                  ]} 
                  onPress={() => setActiveTab('password')}
                >
                <Text style={[
                  styles.tabText,
                  activeTab === 'password' ? styles.activeTabText : null,
                ]}>
                  Change Password
                </Text>
                </TouchableOpacity>
              </View>
            {/* Tab Content */}
            {activeTab === 'profile' ? (
              <ProfileTab
                profileData={profileData}
                errors={errors}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                handleFieldChange={handleFieldChange}
                handleSave={handleSave}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
                handleDateChange={handleDateChange}
                showGenderDropdown={showGenderDropdown}
                setShowGenderDropdown={setShowGenderDropdown}
                genderOptions={genderOptions}
              />
            ) : (
              <PasswordTab
                passwordData={passwordData}
                passwordErrors={passwordErrors}
                passwordLoading={passwordLoading}
                handlePasswordFieldChange={handlePasswordFieldChange}
                handleUpdatePassword={handleUpdatePassword}
                showCurrentPassword={showCurrentPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
              />
            )}
          </ScrollView>
        )}
        {/* DateTimePicker for iOS/Android */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date(profileData.dateOfBirth)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        {/* Image Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <View style={styles.modalContainer}>
              <TouchableOpacity 
                style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
              >
              <FontAwesome name="close" size={24} color="white" />
              </TouchableOpacity>
            <ImageZoom
              cropWidth={width}
              cropHeight={height}
              imageWidth={width}
              imageHeight={width}
            >
              <Image
                source={profileImage ? { uri: profileImage } : DEFAULT_AVATAR}
                style={{ width: width, height: width }}
                resizeMode="contain"
              />
            </ImageZoom>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0D99FF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  contentContainerStyle: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0D99FF',
  },
  tabText: {
    fontSize: 16,
    color: '#757575',
  },
  activeTabText: {
    color: '#0D99FF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  editImageButton: {
    backgroundColor: '#0D99FF',
    padding: 10,
    borderRadius: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 5,
  },
  fieldInput: {
    flex: 1,
    padding: 10,
  },
  errorInput: {
    borderColor: 'red',
  },
  eyeIcon: {
    padding: 10,
  },
  errorText: {
    color: 'red',
    marginTop: 5,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  fieldValue: {
    flex: 1,
  },
  genderDropdown: {
    flexDirection: 'row',
    marginTop: 5,
  },
  genderOption: {
    padding: 10,
  },
  genderOptionText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 20,
  },
});

export default Profile; 