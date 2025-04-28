import axios from "axios";
import { navigate } from "../utils/navigationService"; // Import hàm điều hướng nếu có
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Alert } from "react-native";

const API_BASE_URL = "https://ocms-bea4aagveeejawff.southeastasia-01.azurewebsites.net/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để kiểm tra lỗi 401 (Token hết hạn) và kiểm tra trạng thái tài khoản
api.interceptors.response.use(
  (response) => {
    // Xóa bỏ kiểm tra trạng thái tài khoản và cảnh báo tại đây
    // để tránh hiển thị nhiều lần cảnh báo
    return response; // Trả về response nếu không có lỗi
  }, 
  (error) => {
    if (error.response && error.response.status === 401) {
      const originalRequest = error.config;

      // Kiểm tra xem request có chứa Authorization không -> nghĩa là lỗi xảy ra sau khi đăng nhập
      if (originalRequest.headers.Authorization) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.");
        navigate("Login"); // Điều hướng về màn hình đăng nhập
      }
    }
    return Promise.reject(error);
  }
);
  
// Login function
export const loginUser = async (UserName, password) => {
  try {
    console.log('Login Request:', { username: UserName, password: password });
    
    const response = await api.post("/Login/login", {
      username: UserName,
      password: password,
    });
    
    console.log('Login Response:', response.data);
    
    // Kiểm tra xem phản hồi có thành công và có token không
    if (!response.data || !response.data.token) {
      console.log('Login failed: No valid token in response');
      return null; // Trả về null để component Login biết đăng nhập thất bại
    }
    
    // Đảm bảo trả về đối tượng với thông tin người dùng và vai trò
    // Nếu API không trả về role, kiểm tra xem có thể lấy từ các thuộc tính khác không
    const responseData = response.data;
    
    // Kiểm tra xem API có trả về thông tin vai trò không
    if (!responseData.role && responseData.user && responseData.user.role) {
      responseData.role = responseData.user.role;
    } else if (!responseData.role && responseData.userRole) {
      responseData.role = responseData.userRole;
    }
    
    return responseData;
  } catch (error) {
    console.log('Login Error:', error.response?.data || error.message);
    
    // Kiểm tra phản hồi lỗi cụ thể từ server
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'string') {
        throw error.response.data;
      } else if (error.response.data.message) {
        throw error.response.data.message;
      } else {
        throw "Invalid username or password";
      }
    }
    
    throw "Network error. Please check your connection and try again.";
  }
};

// Get notifications for a user
export const getNotifications = async (userId, token) => {
  try {
    const response = await api.get(`/notifications/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    // Kiểm tra lỗi "không tìm thấy thông báo"
    if (error.response?.data?.message === "No notifications found for this user.") {
      console.log("Không có thông báo cho người dùng này");
      return { data: [] }; // Trả về mảng rỗng thay vì ném lỗi
    }
    // Các lỗi khác vẫn xử lý như cũ
    console.error("Notification API error:", error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Mark notification as read
export const markAsRead = async (notificationId, token) => {
  try {
    const response = await api.post(`/notifications/mark-as-read/${notificationId}`, null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : "Network error";
  }
};

// Get user profile
export const getUserProfile = async (userId, token) => {
  try {
    console.log('Get Profile Request:', {
      url: `/User/profile`,
      token: token
    });

    const response = await api.get(`/User/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Get Profile Response:', response.data);

    // Extract user data from the response
    const userData = response.data?.user || {};
    
    return {
      fullName: userData.fullName || "",
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
      address: userData.address || "",
      gender: userData.gender || "Male",
      dateOfBirth: userData.dateOfBirth || new Date().toISOString(),
      role: userData.roleName || "",
      avatarUrlWithSas: userData.avatarUrlWithSas || null,
      accountStatus: userData.accountStatus || "Active"
    };
  } catch (error) {
    console.error('Get Profile Error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Check account status
export const checkAccountStatus = async (token) => {
  try {
    const response = await api.get(`/User/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const userData = response.data?.user || {};
    const accountStatus = userData.accountStatus || "Unknown";

    return {
      isActive: accountStatus === "Active",
      status: accountStatus
    };
  } catch (error) {
    console.error('Check Account Status Error:', error.response?.data || error.message);
    return { isActive: false, status: "Error", error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData, token) => {
  try {
    // Format date to ISO string with time
    const dateOfBirth = profileData.dateOfBirth 
      ? new Date(profileData.dateOfBirth).toISOString()
      : new Date().toISOString();

    const requestBody = {
      fullName: profileData.fullName,
      gender: profileData.gender,
      dateOfBirth: dateOfBirth,
      address: profileData.address,
      phoneNumber: profileData.phoneNumber
    };

    console.log('Update Profile Request:', {
      url: `/User/${userId}/details`,
      body: requestBody
    });

    const response = await api.put(`/User/${userId}/details`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Update Profile Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update Profile Error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/User/forgot-password`, {
      email: email
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to send reset password email");
    }
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/User/reset-password`, {
      token: token,
      newPassword: newPassword
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || "Failed to reset password");
    }
    throw error;
  }
};
export const getSpecialty = async (SpecialtyId, token) => {
  try {
    console.log('Get Specialty request:', {
      url: `/Specialty/${SpecialtyId}`,
      token: token
    });

    const response = await api.get(`/Specialty/${SpecialtyId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Get Specialty response:', response.data);
    
    // Based on the logs, the API returns a nested structure with data inside
    if (response.data && response.data.success && response.data.data) {
      // Extract from the nested data property
      return {
        specialtyId: response.data.data.specialtyId,
        specialtyName: response.data.data.specialtyName,
        description: response.data.data.description || 'No description available'
      };
    } else if (response.data && response.data.specialtyId) {
      // Direct access if not nested
      return {
        specialtyId: response.data.specialtyId,
        specialtyName: response.data.specialtyName,
        description: response.data.description || 'No description available'
      };
    }
    return null; // Return null if no valid data found
  } catch (error) {
    console.error('Get Specialty error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};
// Get course by ID
export const getCourse = async (courseId, token) => {
  try {
    console.log('Get Course request:', {
      url: `/Course/${courseId}`,
      token: token
    });

    const response = await api.get(`/Course/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Get Course response:', response.data);
    
    // Handle nested data structure similar to specialty endpoint
    if (response.data && response.data.success && response.data.data) {
      // Extract from the nested data property
      return response.data.data;
    } else if (response.data && response.data.courseId) {
      // Direct access if not nested
      return response.data;
    }
    return null; // Return null if no valid data found
  } catch (error) {
    console.error('Get Course error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};
export const getUnreadCount = async (userId, token) => {
  try {
    console.log('Get unread count request:', {
      url: `/notifications/unread-count/${userId}`,
      token: token
    });

    const response = await api.get(`/notifications/unread-count/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Get unread count response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get unread count error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

export const getTrainingPlanUser = async (token) => {
  try {
    console.log('Get Training Plan request:', {
      url: `/TrainingPlan/joined`,
      token: token?.substring(0, 10) + '...' // Only log part of the token for security
    });

    const response = await api.get(`/TrainingPlan/joined`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Log the full response structure for debugging
    console.log('Get Training Plan full response structure:', JSON.stringify(response.data, null, 2));
    console.log('Response type:', typeof response.data);
    
    if (response.data && response.data.plans) {
      console.log('Plans array length:', response.data.plans.length);
      console.log('Plans array content:', JSON.stringify(response.data.plans, null, 2));
      return response.data.plans;
    } else if (response.data && Array.isArray(response.data)) {
      console.log('Response is an array with length:', response.data.length);
      return response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      console.log('Response has data array with length:', response.data.data.length);
      return response.data.data;
    }
    
    // If we reach here, log that we're returning raw data as fallback
    console.log('No recognized structure found, returning raw data');
    return response.data;
  } catch (error) {
    console.error('Get Training Plan error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};
// Get subject by ID
export const getSubject = async (subjectId, token) => {
  try {
    console.log('Get Subject request:', {
      url: `/Subject/${subjectId}`,
      token: token
    });

    const response = await api.get(`/Subject/${subjectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Get Subject response:', response.data);
    
    // Handle nested data structure similar to other endpoints
    if (response.data && response.data.success && response.data.data) {
      // Extract from the nested data property
      return response.data.data;
    } else if (response.data && response.data.subject) {
      // Handle structure with {message, subject}
      console.log('Found subject in response.subject:', response.data.subject);
      return response.data.subject;
    } else if (response.data && response.data.subjectId) {
      // Direct access if not nested
      return response.data;
    }
    return null; // Return null if no valid data found
  } catch (error) {
    console.error('Get Subject error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Change user password
export const changePassword = async (userId, passwordData, token) => {
  try {
    console.log('Change Password Request:', {
      url: `/User/${userId}/password`,
      body: passwordData
    });

    const response = await api.put(`/User/${userId}/password`, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Change Password Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Change Password Error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Get user schedule
export const getSchedule = async (token, role) => {
  try {
    console.log('Fetching schedule with token:', token ? 'Token provided' : 'No token');
    
    // Lấy role từ localStorage nếu không được truyền vào
    if (!role) {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const userObj = JSON.parse(userInfo);
          role = userObj.role || 'student'; // Mặc định là student nếu không tìm thấy
        } else {
          role = 'student'; // Mặc định là student nếu không có userInfo
        }
      } catch (error) {
        console.error('Error getting role from AsyncStorage:', error);
        role = 'student'; // Mặc định là student nếu có lỗi
      }
    }
    
    // Đảm bảo role luôn tồn tại và chuyển sang chữ thường
    const roleValue = (role || 'student').toLowerCase();
    
    console.log('Using role for schedule fetch:', roleValue);
    
    const response = await api.get(`/TrainingSchedule/${roleValue}/subjects`, {
      headers: { Authorization: `Bearer ${token}` } 
    });
    
    console.log('Schedule API response status:', response.status);
    console.log('Schedule API response type:', typeof response.data);
    
    if (!response.data) {
      console.warn('Schedule API returned no data');
      return [];
    }
    
    // Log response for debugging
    if (typeof response.data === 'object') {
      console.log('Response data keys:', Object.keys(response.data));
    }
    
    // Xử lý cấu trúc phản hồi đặc biệt với subschedule
    if (response.data && typeof response.data === 'object') {
      // Xử lý trường hợp lỗi chính tả 'subscheldule' trong API
      if (response.data.subscheldule && Array.isArray(response.data.subscheldule)) {
        console.log('Found subscheldule (with typo) in response with length:', response.data.subscheldule.length);
        return response.data; // Trả về toàn bộ đối tượng để hàm formatScheduleData xử lý
      }
      
      // Xử lý trường hợp đúng chính tả 'subschedule'
      if (response.data.subschedule && Array.isArray(response.data.subschedule)) {
        console.log('Found subschedule in response with length:', response.data.subschedule.length);
        return response.data; // Trả về toàn bộ đối tượng để hàm formatScheduleData xử lý
      }
    }
    
    // Handle other nested response structures
    if (typeof response.data === 'object') {
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log('Returning nested data array structure');
        return response.data.data;
      }
      
      if (response.data.subjects && Array.isArray(response.data.subjects)) {
        console.log('Returning nested subjects array structure');
        return response.data.subjects;
      }
      
      if (Array.isArray(response.data)) {
        console.log('Returning direct array structure');
        return response.data;
      }
    }
    
    // Fallback to direct access if nested structure not found
    console.log('Returning raw data structure');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
};

// Get user information by ID
export const getUserById = async (userId, token) => {
  try {
    if (!userId) {
      console.log('No userId provided to getUserById');
      return { fullName: 'N/A' };
    }
    
    console.log('Fetching user with ID:', userId);
    const response = await api.get(`/User/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('User API response:', response.data);
    
    // Handle the nested response structure
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // Fallback to direct access if nested structure not found
    return response.data || { fullName: 'N/A' };
  } catch (error) {
    console.error('Error fetching user:', error);
    // Return a default object instead of throwing to prevent UI errors
    return { fullName: 'N/A' };
  }
};

// Upload user avatar
export const updateUserAvatar = async (userId, imageUri, token) => {
  try {
    console.log('Uploading avatar for user:', userId);
    
    // Create form data to send the image
    const formData = new FormData();
    
    // Get file name and extension from the URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    // Add file to form data
    formData.append('file', {
      uri: imageUri,
      name: `avatar-${userId}.${fileType}`,
      type: `image/${fileType}`,
    });
    
    console.log('Avatar form data prepared:', formData);
    
    // Send multipart/form-data request
    const response = await axios.put(`${API_BASE_URL}/User/avatar`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Avatar upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Get user avatar
export const getUserAvatar = async (userId, token) => {
  try {
    console.log('Fetching avatar for user:', userId);
    
    // Lấy profile người dùng đã bao gồm avatarUrlWithSas
    const userProfile = await getUserProfile(userId, token);
    
    if (userProfile && userProfile.avatarUrlWithSas) {
      console.log('Avatar fetch successful:', userProfile.avatarUrlWithSas.substring(0, 50) + '...');
      return userProfile.avatarUrlWithSas;
    }
    
    console.log('No avatar URL found in profile');
    return null;
  } catch (error) {
    console.error('Error fetching avatar:', error.message || error);
    return null; // Trả về null thay vì ném lỗi để tránh crash UI
  }
};

// Get certificates for user
export const getCertificates = async (token) => {
  try {
    
    const response = await api.get(`/Certificate/trainee/view`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('[API] Certificates response status:', response.status);
    
    let certificatesList = [];
    if (Array.isArray(response.data)) {
      console.log('[API] Setting directly from array, length:', response.data.length);
      certificatesList = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      console.log('[API] Setting from nested data property, length:', response.data.data.length);
      certificatesList = response.data.data;
    } else if (response.data && typeof response.data === 'object') {
      console.log('[API] Response is object, keys:', Object.keys(response.data));
      // If object can be converted to array
      if (response.data && Object.keys(response.data).length > 0) {
        try {
          const possibleArray = Object.values(response.data);
          if (Array.isArray(possibleArray[0])) {
            console.log('[API] Setting from first array value in object, length:', possibleArray[0].length);
            certificatesList = possibleArray[0];
          }
        } catch (err) {
          console.error('[API] Error processing response data:', err);
        }
      }
    }
    
    return certificatesList;
  } catch (error) {
    console.error('[API] Error fetching certificates:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Get user grades
export const getUserGrades = async (userId, token) => {
  try {
    console.log('[API] Fetching grades for user:', userId);
    
    const response = await api.get(`/Grade/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('[API] Grades response status:', response.status);
    
    let gradesList = [];
    if (Array.isArray(response.data)) {
      console.log('[API] Setting directly from array, length:', response.data.length);
      gradesList = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      console.log('[API] Setting from nested data property, length:', response.data.data.length);
      gradesList = response.data.data;
    } else if (response.data && typeof response.data === 'object') {
      console.log('[API] Response is object, keys:', Object.keys(response.data));
      // If object can be converted to array
      if (response.data && Object.keys(response.data).length > 0) {
        try {
          const possibleArray = Object.values(response.data);
          if (Array.isArray(possibleArray[0])) {
            console.log('[API] Setting from first array value in object, length:', possibleArray[0].length);
            gradesList = possibleArray[0];
          }
        } catch (err) {
          console.error('[API] Error processing response data:', err);
        }
      }
    }
    
    return gradesList;
  } catch (error) {
    console.error('[API] Error fetching grades:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
  }
};

// Import grades from Excel file
export const uploadGradeExcel = async (fileUri, token) => {
  try {
    console.log('[API] Uploading grades Excel file:', fileUri);
    
    // Get file name from the URI
    const fileName = fileUri.split('/').pop();
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
      name: fileName,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    console.log('[API] FormData created with file:', fileName);
    
    // Log the formData to inspect what's being sent
    for (const [key, value] of Object.entries(formData._parts)) {
      console.log(`FormData part - ${key}:`, value);
    }
    
    // Send the file to the API endpoint
    const response = await axios.post(`${API_BASE_URL}/Grade/import`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
    });
    
    console.log('[API] Excel upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error uploading Excel file:', error.response?.data || error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('[API] Error status:', error.response.status);
      console.error('[API] Error headers:', error.response.headers);
      console.error('[API] Error data:', error.response.data);
    }
    
    if (error.response && error.response.data) {
      throw error.response.data;
    } else {
      throw "Network error. Please check your connection and try again.";
    }
  }
};

// Get all grades
export const getAllGrades = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/Grade`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const userId = await AsyncStorage.getItem('userId');
    
    // Kiểm tra data có phải là mảng không
    if (response.data && Array.isArray(response.data)) {
      // Nếu cần lọc theo instructor ID
      if (userId) {
        return response.data.filter(item => item.gradedByInstructorId === userId);
      }
      return response.data;  
    }
    
    console.log("API response is not an array:", response.data);
    return [];
  } catch (error) {
    console.error("Error fetching grades:", error);
    throw error;
  }
};

// Update grade
export const updateGrade = async (gradeData, token) => {
  try {
    console.log(`Sending PUT request to ${API_BASE_URL}/Grade/${gradeData.gradeId}`);
    console.log("Request body:", JSON.stringify(gradeData));
    
    const response = await axios.put(`${API_BASE_URL}/Grade/${gradeData.gradeId}`, {
      traineeAssignID: gradeData.traineeAssignID,
      subjectId: gradeData.subjectId,
      participantScore: gradeData.participantScore,
      assignmentScore: gradeData.assignmentScore,
      finalExamScore: gradeData.finalExamScore,
      finalResitScore: gradeData.finalResitScore,
      remarks: gradeData.remarks
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("Update grade response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error - updateGrade:", error.response?.data || error.message);
    throw error;
  }
};
