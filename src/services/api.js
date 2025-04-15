import axios from "axios";
import { navigate } from "../utils/navigationService"; // Import hàm điều hướng nếu có
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://ocms-bea4aagveeejawff.southeastasia-01.azurewebsites.net/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để kiểm tra lỗi 401 (Token hết hạn)
api.interceptors.response.use(
    (response) => response, // Trả về response nếu không có lỗi
    (error) => {
      if (error.response && error.response.status === 401) {
        const originalRequest = error.config;
  
        // Kiểm tra xem request có chứa Authorization không -> nghĩa là lỗi xảy ra sau khi đăng nhập
        if (originalRequest.headers.Authorization) {
          alert("Token has expired, please log in again."); // Hiển thị thông báo lỗi bằng tiếng Anh
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
      avatarUrlWithSas: userData.avatarUrlWithSas || null
    };
  } catch (error) {
    console.error('Get Profile Error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
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
