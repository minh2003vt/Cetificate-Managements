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
    const response = await api.get(`/User/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : "Network error";
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData, token) => {
  try {
    const requestBody = {
      fullName: profileData.fullName,
      gender: profileData.gender,
      dateOfBirth: profileData.dateOfBirth + "T16:22:16.959Z", // Thêm thời gian để match format API
      address: profileData.address,
      phoneNumber: profileData.phoneNumber
    };

    const response = await api.put(`/User/${userId}/details`, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : "Network error";
  }
};
