import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BACKGROUND_HOMEPAGE } from '../../utils/assets';
import { getCourse } from '../../services/api';

const API_BASE_URL = "https://ocms-bea4aagveeejawff.southeastasia-01.azurewebsites.net/api";

const History = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [certificates, setCertificates] = useState([]);
  const [courseNames, setCourseNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hàm lấy tên khóa học
  const fetchCourseNames = async (certificatesList) => {
    if (!certificatesList || !certificatesList.length) return;
    
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      
      const uniqueCourseIds = [...new Set(certificatesList.map(cert => cert.courseId))];
      console.log("[History] Fetching course names for:", uniqueCourseIds);
      
      const courseNamesMap = {};
      
      // Lấy thông tin khóa học cho từng courseId
      for (const courseId of uniqueCourseIds) {
        if (!courseId) continue;
        
        try {
          const courseData = await getCourse(courseId, token);
          if (courseData && courseData.courseName) {
            courseNamesMap[courseId] = courseData.courseName;
          } else {
            courseNamesMap[courseId] = "Khóa học N/A";
          }
        } catch (err) {
          console.error(`[History] Error fetching course name for ID ${courseId}:`, err);
          courseNamesMap[courseId] = "Khóa học N/A";
        }
      }
      
      console.log("[History] Fetched course names:", courseNamesMap);
      setCourseNames(courseNamesMap);
    } catch (err) {
      console.error("[History] Error fetching course names:", err);
    }
  };

  useEffect(() => {
    console.log('[NETWORK DEBUG] History component mounted');
    
    const fetchCertificates = async () => {
      try {
        console.log('[NETWORK DEBUG] History - Bắt đầu fetching certificates');
        setLoading(true);
        
        // Lấy thông tin xác thực
        const userToken = await AsyncStorage.getItem("userToken");
        const userId = await AsyncStorage.getItem("userId");
        
        console.log('[NETWORK DEBUG] History - UserId:', userId);
        console.log('[NETWORK DEBUG] History - Token có sẵn:', !!userToken);
        
        if (!userToken || !userId) {
          throw new Error("Bạn cần đăng nhập để xem chứng chỉ");
        }
        
        // Log trước khi gửi request
        console.log('[NETWORK DEBUG] History - Sending request to:', `${API_BASE_URL}/Certificate/trainee/${userId}`);
        console.log('[NETWORK DEBUG] History - Headers:', { Authorization: `Bearer ${userToken.substring(0, 10)}...` });
        
        // Tạo axios interceptor tạm thời cho request này
        const axiosInstance = axios.create();
        
        axiosInstance.interceptors.request.use(
          config => {
            console.log('[NETWORK DEBUG] History - Full request config:', {
              url: config.url,
              method: config.method,
              headers: config.headers
            });
            return config;
          },
          error => {
            console.error('[NETWORK DEBUG] History - Request error interceptor:', error);
            return Promise.reject(error);
          }
        );
        
        axiosInstance.interceptors.response.use(
          response => {
            console.log('[NETWORK DEBUG] History - Response status:', response.status);
            console.log('[NETWORK DEBUG] History - Response headers:', response.headers);
            return response;
          },
          error => {
            if (error.response) {
              console.error('[NETWORK DEBUG] History - Error response:', {
                status: error.response.status,
                headers: error.response.headers,
                data: error.response.data
              });
            } else if (error.request) {
              console.error('[NETWORK DEBUG] History - No response received:', error.request);
            } else {
              console.error('[NETWORK DEBUG] History - Error setting up request:', error.message);
            }
            return Promise.reject(error);
          }
        );
        
        // Gửi request với interceptors
        const response = await axiosInstance.get(
          `${API_BASE_URL}/Certificate/trainee/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );
        
        console.log("[NETWORK DEBUG] History - Certificates response status:", response.status);
        console.log("[NETWORK DEBUG] History - Certificates data type:", typeof response.data);
        console.log("[NETWORK DEBUG] History - Is array?", Array.isArray(response.data));
        console.log("[NETWORK DEBUG] History - Data sample:", 
          JSON.stringify(Array.isArray(response.data) ? response.data.slice(0, 1) : response.data).substring(0, 300)
        );
        
        let certificatesList = [];
        if (Array.isArray(response.data)) {
          console.log("[NETWORK DEBUG] History - Setting directly from array, length:", response.data.length);
          certificatesList = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          console.log("[NETWORK DEBUG] History - Setting from nested data property, length:", response.data.data.length);
          certificatesList = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
          console.log("[NETWORK DEBUG] History - Response is object, keys:", Object.keys(response.data));
          // Nếu đối tượng có thể chuyển đổi thành mảng
          if (response.data && Object.keys(response.data).length > 0) {
            try {
              const possibleArray = Object.values(response.data);
              if (Array.isArray(possibleArray[0])) {
                console.log("[NETWORK DEBUG] History - Setting from first array value in object, length:", possibleArray[0].length);
                certificatesList = possibleArray[0];
              }
            } catch (err) {
              console.error("[NETWORK DEBUG] History - Error processing response data:", err);
            }
          }
        }
        
        setCertificates(certificatesList);
        
        // Sau khi lấy danh sách chứng chỉ, lấy tên các khóa học
        await fetchCourseNames(certificatesList);
        
        setError(null);
      } catch (err) {
        console.error("[NETWORK DEBUG] History - Error fetching certificates:", err);
        console.error("[NETWORK DEBUG] History - Error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setError("Không thể lấy danh sách chứng chỉ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        console.log('[NETWORK DEBUG] History - Fetch complete');
      }
    };

    fetchCertificates();
  }, []);

  // Thêm useEffect để ghi log API calls
  useEffect(() => {
    console.log('[NETWORK DEBUG] History component mounted');
    
    // Thêm interceptor cho Axios hoặc Fetch
    const originalFetch = global.fetch;
    
    global.fetch = function(url, options) {
      console.log('[NETWORK DEBUG] History - Fetch request:', url, options);
      return originalFetch(url, options)
        .then(response => {
          console.log('[NETWORK DEBUG] History - Fetch response status:', response.status);
          return response;
        })
        .catch(error => {
          console.error('[NETWORK DEBUG] History - Fetch error:', error);
          throw error;
        });
    };
    
    // Khôi phục fetch gốc khi component unmount
    return () => {
      global.fetch = originalFetch;
      console.log('[NETWORK DEBUG] History component unmounted');
    };
  }, []);

  // Hàm format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  };

  const renderItem = ({ item }) => {
    // Lấy tên khóa học từ state courseNames nếu có, nếu không, sử dụng courseId
    const courseName = courseNames[item.courseId] || `Course ID: ${item.courseId}`;
    
    return (
      <TouchableOpacity
        onPress={() => 
          navigation.navigate("Certificate", { 
            certificateData: item,
            title: courseName
          })
        }
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <Text style={styles.title}>
            {item.certificateCode || "Certificate Code N/A"}
          </Text>
          <Text style={styles.subtitle}>
            {courseName}
          </Text>
          <Text style={styles.date}>
            {item.status === "Active" 
              ? `Completed at ${formatDate(item.issueDate)}` 
              : item.status || "Status N/A"}
          </Text>
        </View>
        <FontAwesome
          name={item.status === "Active" ? "check-circle" : "hourglass-half"}
          size={30}
          color={item.status === "Active" ? "green" : "white"}
          style={styles.icon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
        </View>

        {/* Danh sách lịch sử */}
        <View style={[styles.listContainer, { width, height: height * 0.8 }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1D72F3" />
              <Text style={styles.loadingText}>Đang tải chứng chỉ...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <FontAwesome name="exclamation-circle" size={50} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  fetchCertificates();
                }}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="certificate" size={50} color="#B8C4D1" />
              <Text style={styles.emptyText}>Bạn chưa có chứng chỉ nào.</Text>
            </View>
          ) : (
          <FlatList
            data={certificates}
              keyExtractor={(item) => item.certificateId.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10, 
    position: "relative",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: "5%",
    paddingVertical: "5%",
    position: "absolute",
    bottom: 0,
  },
  card: {
    backgroundColor: "#43546A",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "#E0E0E0",
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: "#B8C4D1",
    marginTop: 4,
  },
  icon: {
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#1D72F3",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1D72F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#B8C4D1",
    textAlign: "center",
  },
});

export default History;
