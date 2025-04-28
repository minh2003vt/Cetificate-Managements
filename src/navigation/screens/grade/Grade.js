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
  Modal,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import { getUserGrades, getSubject } from '../../../services/api';

const Grade = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [grades, setGrades] = useState([]);
  const [subjectNames, setSubjectNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Hàm lấy tên môn học
  const fetchSubjectNames = async (gradesList) => {
    if (!gradesList || !gradesList.length) return;
    
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      
      const uniqueSubjectIds = [...new Set(gradesList.map(grade => grade.subjectId))];
      console.log("[Grade] Fetching subject names for:", uniqueSubjectIds);
      
      const subjectNamesMap = {};
      
      // Get subject information for each subjectId
      for (const subjectId of uniqueSubjectIds) {
        if (!subjectId) continue;
        
        try {
          const subjectData = await getSubject(subjectId, token);
          
          if (subjectData && subjectData.subjectName) {
            subjectNamesMap[subjectId] = subjectData.subjectName;
          } else {
            subjectNamesMap[subjectId] = `Subject ${subjectId}`;
          }
        } catch (err) {
          subjectNamesMap[subjectId] = `Subject ${subjectId}`;
        }
      }
      
      console.log("[Grade] Final subject names mapping:", subjectNamesMap);
      setSubjectNames(subjectNamesMap);
    } catch (err) {
      console.error("[Grade] Error fetching subject names:", err);
    }
  };

  useEffect(() => {
    console.log('[Grade] Component mounted');
    
    const fetchGradesData = async () => {
      try {
        console.log('[Grade] Starting grades fetch');
        setLoading(true);
        
        // Get authentication info
        const userToken = await AsyncStorage.getItem("userToken");
        const userId = await AsyncStorage.getItem("userId");
        
        console.log('[Grade] UserId:', userId);
        console.log('[Grade] Token available:', !!userToken);
        
        if (!userToken || !userId) {
          throw new Error("Bạn cần đăng nhập để xem điểm số");
        }
        
        // Get grades using the API function
        const gradesList = await getUserGrades(userId, userToken);
        
        setGrades(gradesList);
        
        // After getting grades, fetch their subject names
        await fetchSubjectNames(gradesList);
        
        setError(null);
      } catch (err) {
        console.error("[Grade] Error fetching grades:", err);
        console.error("[Grade] Error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setError("Không thể tải điểm số. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
        console.log('[Grade] Fetch complete');
      }
    };

    fetchGradesData();
  }, []);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  };

  const getStatusColor = (status) => {
    if (!status) return "#999";
    status = status.toLowerCase();
    return status === "pass" ? "#4CAF50" : status === "fail" ? "#F44336" : "#FF9800";
  };

  const renderItem = ({ item }) => {
    // Get subject name from subjectNames state if available, otherwise use subjectId
    const subjectName = subjectNames[item.subjectId] || `Subject ${item.subjectId}`;
    console.log(`[Grade] Rendering item for ${item.subjectId}, name:`, subjectName);
    
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedGrade(item);
          setModalVisible(true);
        }}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {subjectName}
            </Text>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.gradeStatus) }]}>
              <Text style={styles.statusText}>{item.gradeStatus || "N/A"}</Text>
            </View>
          </View>
          
          <Text style={styles.date}>
            {`${formatDate(item.evaluationDate)}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedGrade) return null;
    
    // Get subject name for the selected grade
    const subjectName = subjectNames[selectedGrade.subjectId] || `Subject ID: ${selectedGrade.subjectId}`;
    
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeIcon}
              onPress={() => setModalVisible(false)}
            >
              <FontAwesome name="times" size={24} color="#43546A" />
            </TouchableOpacity>

            <View style={styles.modalContentView}>
              <Text style={styles.modalTitle}>{subjectName}</Text>
              <View style={styles.separator} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Participant:</Text>
                <Text style={styles.detailValue}>{selectedGrade.participantScore ? parseFloat(selectedGrade.participantScore).toFixed(2) : "N/A"}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assignment:</Text>
                <Text style={styles.detailValue}>{selectedGrade.assignmentScore ? parseFloat(selectedGrade.assignmentScore).toFixed(2) : "N/A"}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Final Exam:</Text>
                <Text style={styles.detailValue}>{selectedGrade.finalExamScore ? parseFloat(selectedGrade.finalExamScore).toFixed(2) : "N/A"}</Text>
              </View>
              
              {selectedGrade.finalResitScore !== null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Resit:</Text>
                  <Text style={styles.detailValue}>{selectedGrade.finalResitScore ? parseFloat(selectedGrade.finalResitScore).toFixed(2) : "N/A"}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Final Score:</Text>
                <Text style={[styles.detailValue, styles.totalScore]}>
                  {selectedGrade.totalScore ? parseFloat(selectedGrade.totalScore).toFixed(2) : "N/A"}
                </Text>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Result:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedGrade.gradeStatus) }]}>
                  <Text style={styles.statusText}>{selectedGrade.gradeStatus || "N/A"}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Evaluation Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedGrade.evaluationDate)}</Text>
              </View>
              
              {selectedGrade.remarks && (
                <View style={styles.remarksContainer}>
                  <Text style={styles.remarksLabel}>Notes:</Text>
                  <Text style={styles.remarksText}>{selectedGrade.remarks}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
          <Text style={styles.headerTitle}>Score</Text>
        </View>

        {/* Danh sách điểm số */}
        <View style={[styles.listContainer, { width, height: height * 0.8 }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1D72F3" />
              <Text style={styles.loadingText}>Loading grades...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <FontAwesome name="exclamation-circle" size={50} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  fetchGradesData();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : grades.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="graduation-cap" size={50} color="#B8C4D1" />
              <Text style={styles.emptyText}>You have no grades yet</Text>
            </View>
          ) : (
            <FlatList
              data={grades}
              keyExtractor={(item) => item.gradeId.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        
        {/* Render detail modal */}
        {renderDetailModal()}
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
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 13,
    color: "#B8C4D1",
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
  
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  closeIcon: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 1,
    padding: 5,
  },
  modalContentView: {
    marginTop: 10,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#43546A",
    marginBottom: 15,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#DDD",
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  totalScore: {
    fontSize: 20,
    color: "#1D72F3",
  },
  remarksContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  remarksLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 5,
  },
  remarksText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});

export default Grade; 