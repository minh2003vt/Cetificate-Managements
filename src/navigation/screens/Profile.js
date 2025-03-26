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
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile, updateUserProfile } from '../../services/api';

const Profile = ({ navigation }) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const [profileData, setProfileData] = useState({
    fullName: "",
    gender: "Male",
    dateOfBirth: new Date().toISOString().split('T')[0],
    address: "",
    email: "",
    phoneNumber: "",
    personalID: "",
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFullPhone, setShowFullPhone] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gender options
  const genderOptions = ["Male", "Female", "Other"];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      if (!userId || !token) {
        Alert.alert('Error', 'User not authenticated');
        navigation.navigate('Login');
        return;
      }

      const userData = await getUserProfile(userId, token);
      if (userData) {
        setProfileData({
          fullName: userData.fullName || "",
          gender: userData.gender || "Male",
          dateOfBirth: userData.dateOfBirth?.split('T')[0] || new Date().toISOString().split('T')[0],
          address: userData.address || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          personalID: userData.personalID || "",
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
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
        quality: 1,
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setProfileImage(selectedAsset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!profileData.fullName.trim()) {
        Alert.alert('Error', 'Full name is required');
        return;
      }

      if (!profileData.gender) {
        Alert.alert('Error', 'Gender is required');
        return;
      }

      if (!profileData.dateOfBirth) {
        Alert.alert('Error', 'Date of birth is required');
        return;
      }

      if (!profileData.address.trim()) {
        Alert.alert('Error', 'Address is required');
        return;
      }

      if (!profileData.phoneNumber.trim()) {
        Alert.alert('Error', 'Phone number is required');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      if (!userId || !token) {
        Alert.alert('Error', 'User not authenticated');
        navigation.navigate('Login');
        return;
      }

      setLoading(true);
      await updateUserProfile(userId, profileData, token);
      
      // Cập nhật fullName trong AsyncStorage
      await AsyncStorage.setItem("userFullName", profileData.fullName);
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
      
      // Reload user profile to get updated data
      await loadUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
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
    if (showFullPhone) {
      return phone;
    }
    return `******${phone.slice(-2)}`;
  };

  const renderField = (label, value, key) => {
    if (key === 'gender') {
      return (
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          {isEditing ? (
            <View style={[styles.pickerContainer, { borderBottomColor: theme.border }]}>
              <Picker
                selectedValue={value}
                onValueChange={(itemValue) =>
                  setProfileData(prev => ({ ...prev, gender: itemValue }))
                }
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}
              >
                {genderOptions.map((option) => (
                  <Picker.Item 
                    key={option} 
                    label={option} 
                    value={option}
                    color={theme.text}
                  />
                ))}
              </Picker>
            </View>
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
            <TouchableOpacity 
              style={[styles.dateSelector, { borderBottomColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
              <FontAwesome name="calendar" size={16} color={theme.text} />
            </TouchableOpacity>
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
          </View>
        </View>
      );
    }

    return (
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={[
              styles.input, 
              { 
                borderBottomColor: theme.border,
                color: theme.text,
              }
            ]}
            value={value}
            onChangeText={(text) => setProfileData(prev => ({...prev, [key]: text}))}
            placeholderTextColor={theme.textSecondary}
          />
        ) : (
          <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        )}
      </View>
    );
  };

  return (
    <ImageBackground 
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <FontAwesome name={isEditing ? "check" : "edit"} size={24} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={() => setShowImageModal(true)}>
                <Image
                  source={profileImage ? { uri: profileImage } : require('../../../assets/default-avatar.png')}
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

            <ScrollView contentContainerStyle={[styles.contentContainer]}>
              <View style={styles.card}>
                <View style={styles.infoContainer}>
                  {renderField("Full Name", profileData.fullName, "fullName")}
                  {renderField("Gender", profileData.gender, "gender")}
                  {renderField("Date of Birth", profileData.dateOfBirth, "dateOfBirth")}
                  {renderField("Address", profileData.address, "address")}
                  {renderField("Email", profileData.email, "email")}
                  {renderField("Phone Number", profileData.phoneNumber, "phoneNumber")}
                  {renderField("Personal ID", profileData.personalID, "personalID")}
                </View>

                {isEditing && (
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.primary }]} 
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </>
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
                <FontAwesome name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ImageZoom
              cropWidth={width}
              cropHeight={height * 0.8}
              imageWidth={width}
              imageHeight={width}
            >
              <Image
                source={profileImage ? { uri: profileImage } : require('../../../assets/default-avatar.png')}
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
        {Platform.OS === 'ios' ? (
          showDatePicker && (
            <Modal
              transparent={true}
              visible={showDatePicker}
              animationType="slide"
            >
              <View style={[styles.datePickerContainer, { backgroundColor: theme.modalBackground }]}>
                <View style={[styles.datePickerHeader, { backgroundColor: theme.cardSolid }]}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      handleDateChange(null, new Date(profileData.dateOfBirth));
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.datePickerButtonText, { color: theme.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={new Date(profileData.dateOfBirth)}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) {
                      setProfileData(prev => ({
                        ...prev,
                        dateOfBirth: date.toISOString().split('T')[0]
                      }));
                    }
                  }}
                  maximumDate={new Date()}
                  style={[styles.datePicker, { backgroundColor: theme.cardSolid }]}
                  textColor={theme.text}
                />
              </View>
            </Modal>
          )
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={new Date(profileData.dateOfBirth)}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              textColor={theme.text}
            />
          )
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
    backgroundColor: 'white',
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
});

export default Profile; 