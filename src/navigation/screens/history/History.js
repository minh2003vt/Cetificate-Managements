import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKGROUND_HOMEPAGE, HISTORY_STYLES } from '../../../utils/assets';
import { getCourse, getCertificates } from '../../../services/api';

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
      
      // Get course information for each courseId
      for (const courseId of uniqueCourseIds) {
        if (!courseId) continue;
        
        try {
          const courseData = await getCourse(courseId, token);
          if (courseData && courseData.courseName) {
            courseNamesMap[courseId] = courseData.courseName;
          } else {
            courseNamesMap[courseId] = "Course N/A";
          }
        } catch (err) {
          courseNamesMap[courseId] = "Course N/A";
        }
      }
      
      setCourseNames(courseNamesMap);
    } catch (err) {
      console.error("[History] Error fetching course names:", err);
    }
  };

  // Di chuyển hàm fetchCertificatesData ra khỏi useEffect
  const fetchCertificatesData = async () => {
    try {
      setLoading(true);
      
      const userToken = await AsyncStorage.getItem("userToken");
    
      
      if (!userToken) {
        throw new Error("You need to login to view certificates");
      }
      
      // Get certificates using the API function
      const certificatesList = await getCertificates(userToken);
      
      // Lọc bỏ các chứng chỉ có status là "Pending"
      const filteredCertificates = certificatesList.filter(cert => cert.status !== "Pending");
      
      setCertificates(filteredCertificates);
      
      // After getting certificates, fetch their course names
      await fetchCourseNames(filteredCertificates);
      
      setError(null);
    } catch (err) {
      console.error("[History] Error fetching certificates:", err);
      console.error("[History] Error details:", {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setError("Unable to load certificates. Please try again later.");
    } finally {
      setLoading(false);
      console.log('[History] Fetch complete');
    }
  };

  useEffect(() => {
    console.log('[History] Component mounted');
    fetchCertificatesData();
  }, []);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  };

  const renderItem = ({ item }) => {
    // Get course name from courseNames state if available, otherwise use courseId
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
        <FontAwesome name="arrow-right" size={24} color="#43546A" />
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
                  fetchCertificatesData();
                }}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="certificate" size={50} color="#B8C4D1" />
              <Text style={styles.emptyText}>You dont have any certificate yet.</Text>
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