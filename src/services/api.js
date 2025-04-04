import axios from "axios";
import { navigate } from "../utils/navigationService"; // Import hàm điều hướng nếu có

const API_BASE_URL = "https://ocms-vjvn.azurewebsites.net/api";

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
    return response.data;
  } catch (error) {
    console.log('Login Error:', error.response?.data || error.message);
    throw error.response ? error.response.data : "Network error";
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
      url: `/User/${userId}`,
      token: token
    });

    const response = await api.get(`/User/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Get Profile Response:', response.data);

    // Extract user data from the response
    const userData = response.data?.user || {};
    
    return {
      fullName: userData.fullName || "",
      email: userData.email || "",  // API returns userName for email
      phoneNumber: userData.phoneNumber || "",
      address: userData.address || "",
      gender: userData.gender || "Male",
      dateOfBirth: userData.dateOfBirth || new Date().toISOString()
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

// Get unread notifications count
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
