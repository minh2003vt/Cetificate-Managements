import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from './navigationService';
import { checkAccountStatus } from '../services/api';

/**
 * Kiểm tra trạng thái tài khoản và chuyển hướng về màn hình đăng nhập nếu tài khoản không hoạt động
 * @param {Function} callback Tùy chọn callback được gọi sau khi kiểm tra xong nếu tài khoản hoạt động
 * @returns {Promise<boolean>} Trả về true nếu tài khoản hoạt động, false nếu không
 */
export const verifyAccountStatus = async (callback = null) => {
  try {
    // Lấy token từ AsyncStorage
    const token = await AsyncStorage.getItem('userToken');

    if (!token) {
      // Nếu không có token, chuyển hướng về màn hình đăng nhập
      navigate('Login');
      return false;
    }

    // Kiểm tra trạng thái tài khoản
    const { isActive, status } = await checkAccountStatus(token);

    if (!isActive) {
      // Xóa dữ liệu đăng nhập thay vì hiển thị thông báo ở đây
      AsyncStorage.clear();
      // Chuyển hướng về màn hình đăng nhập
      navigate('Login');
      return false;
    }

    // Nếu có callback và tài khoản hoạt động, gọi callback
    if (callback && typeof callback === 'function') {
      callback();
    }

    return true;
  } catch (error) {
    console.error('Error verifying account status:', error);
    return false;
  }
};

/**
 * Thiết lập kiểm tra trạng thái tài khoản định kỳ
 * @param {number} interval Khoảng thời gian giữa các lần kiểm tra (mặc định: 5 phút)
 * @returns {number} ID của interval để có thể xóa nếu cần
 */
export const setupAccountStatusCheck = (interval = 5 * 60 * 1000) => {
  // Kiểm tra ngay khi thiết lập
  verifyAccountStatus();
  
  // Thiết lập kiểm tra định kỳ
  return setInterval(() => {
    verifyAccountStatus();
  }, interval);
};

/**
 * Xóa kiểm tra trạng thái tài khoản định kỳ
 * @param {number} intervalId ID của interval cần xóa
 */
export const clearAccountStatusCheck = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
}; 