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
  Alert,
  Share,
  Platform,
  Modal,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import axios from "axios";
import { getSubject, getAllGrades, updateGrade } from '../../../services/api';

const ViewGrade = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectList, setSubjectList] = useState([]);
  const [subjectNames, setSubjectNames] = useState({});
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editedGrade, setEditedGrade] = useState({
    traineeAssignID: '',
    subjectId: '',
    participantScore: '',
    assignmentScore: '',
    finalExamScore: '',
    finalResitScore: '',
    remarks: ''
  });
  const [errors, setErrors] = useState({
    participantScore: '',
    assignmentScore: '',
    finalExamScore: '',
    finalResitScore: ''
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    // Áp dụng bộ lọc khi thay đổi môn học được chọn
    filterBySubject(selectedSubject);
  }, [grades, selectedSubject]);

  useEffect(() => {
    if (subjectList.length > 0 && !selectedSubject) {
      setSelectedSubject(subjectList[0]);
    }
  }, [subjectList]);

  // Hàm lấy tên môn học dựa trên subjectId
  const fetchSubjectNames = async (gradesList) => {
    if (!gradesList || !gradesList.length) return;
    
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      
      const uniqueSubjectIds = [...new Set(gradesList.map(grade => grade.subjectId).filter(Boolean))];
      console.log("[ViewGrade] Fetching subject names for:", uniqueSubjectIds);
      
      const subjectNamesMap = {};
      
      // Lấy thông tin môn học cho mỗi subjectId
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
          console.error(`[ViewGrade] Error fetching subject name for ${subjectId}:`, err);
          subjectNamesMap[subjectId] = `Subject ${subjectId}`;
        }
      }
      
      console.log("[ViewGrade] Final subject names mapping:", subjectNamesMap);
      setSubjectNames(subjectNamesMap);
    } catch (err) {
      console.error("[ViewGrade] Error fetching subject names:", err);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const response = await getAllGrades(token);

      console.log("Grades API response:", response);
      
      setGrades(response);
      
      // Tạo danh sách các môn học duy nhất
      const subjects = [...new Set(response.map(grade => grade.subjectId).filter(Boolean))];
      const sortedSubjects = subjects.sort();
      setSubjectList(sortedSubjects);
      
      // Nếu chưa chọn môn học nào, chọn môn học đầu tiên
      if (sortedSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(sortedSubjects[0]);
      } else {
        // Apply filter with current selectedSubject
        filterBySubject(selectedSubject);
      }
      
      // Lấy tên môn học
      await fetchSubjectNames(response);
      
      setError(null);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setError("Failed to load grades. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filterBySubject = (subjectId) => {
    if (!subjectId) {
      setFilteredGrades(grades);
    } else {
      const filtered = grades.filter(grade => grade.subjectId === subjectId);
      setFilteredGrades(filtered);
    }
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  };

  // Convert array of objects to CSV
  const convertToCSV = (objArray) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = 'No,Subject,Participant,Assignment,Exam,Resit,Total,Status\r\n';

    for (let i = 0; i < array.length; i++) {
      let line = '';
      line += (i + 1) + ',';
      // Sử dụng tên môn học nếu có, nếu không thì dùng subjectId
      const subjectName = subjectNames[array[i].subjectId] || array[i].subjectId || 'N/A';
      line += subjectName + ',';
      line += (array[i].participantScore || '0') + ',';
      line += (array[i].assignmentScore || '0') + ',';
      line += (array[i].finalExamScore || '0') + ',';
      line += (array[i].finalResitScore || '0') + ',';
      line += (array[i].totalScore || '0') + ',';
      line += (array[i].gradeStatus || 'N/A');
      str += line + '\r\n';
    }
    return str;
  };

  const exportToExcel = async () => {
    if (filteredGrades.length === 0) {
      Alert.alert('Không có dữ liệu', 'Không có dữ liệu để xuất.');
      return;
    }

    try {
      setExporting(true);
      
      // Tạo nội dung CSV
      const csvString = convertToCSV(filteredGrades);
      
      // Chia sẻ dữ liệu dạng text
      const shareResult = await Share.share({
        title: 'Dữ liệu điểm số',
        message: csvString,
      });
      
      console.log('Share result:', shareResult);
      
      if (shareResult.action === Share.sharedAction) {
        if (shareResult.activityType) {
          console.log('Shared with activity type:', shareResult.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (shareResult.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Xuất dữ liệu thất bại', 'Không thể xuất dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  const handleCellDoubleClick = (grade) => {
    setSelectedGrade(grade);
    setEditedGrade({
      gradeId : grade.gradeId || "",
      traineeAssignID: grade.traineeAssignID || "",
      subjectId: grade.subjectId || "",
      participantScore: grade.participantScore?.toString() || '',
      assignmentScore: grade.assignmentScore?.toString() || '',
      finalExamScore: grade.finalExamScore?.toString() || '',
      finalResitScore: grade.finalResitScore?.toString() || '',
      remarks: grade.remarks || ''
    });
    setModalVisible(true);
  };

  const validateScore = (score) => {
    // Chuyển đổi dấu phẩy thành dấu chấm
    const normalizedScore = score.replace(',', '.');
    const num = parseFloat(normalizedScore);
    if (isNaN(num)) return false;
    return num >= 0 && num <= 10;
  };

  const handleScoreChange = (field, value) => {
    // Cho phép số, dấu chấm và dấu phẩy
    const filteredValue = value.replace(/[^0-9.,]/g, '');
    
    // Validate điểm số
    let error = '';
    if (filteredValue !== '') {
      if (!validateScore(filteredValue)) {
        error = 'Score must be between 0-10';
      }
    }

    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Xử lý logic disable giữa Final Exam và Final Resit
    if (field === 'finalExamScore' && parseFloat(filteredValue.replace(',', '.')) > 0) {
      setEditedGrade(prev => ({
        ...prev,
        [field]: filteredValue,
        finalResitScore: '0' // Reset Final Resit về 0 nếu Final Exam > 0
      }));
    } 
    else if (field === 'finalResitScore' && parseFloat(filteredValue.replace(',', '.')) > 0) {
      setEditedGrade(prev => ({
        ...prev,
        [field]: filteredValue,
        finalExamScore: '0' // Reset Final Exam về 0 nếu Final Resit > 0
      }));
    }
    else {
      setEditedGrade(prev => ({
        ...prev,
        [field]: filteredValue
      }));
    }
  };

  const handleSave = async () => {
    // Validate all scores before saving
    const scores = ['participantScore', 'assignmentScore', 'finalExamScore', 'finalResitScore'];
    let hasErrors = false;
    const newErrors = {};

    scores.forEach(field => {
      if (editedGrade[field] !== '' && !validateScore(editedGrade[field])) {
        newErrors[field] = 'Score must be between 0-10';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!selectedGrade.gradeId) {
        Alert.alert('Error', 'Missing grade ID');
        return;
      }
      
      if (!selectedGrade.traineeAssignID) {
        Alert.alert('Error', 'Missing trainee assignment ID');
        return;
      }
      
      const updatedGrade = {
        gradeId: selectedGrade.gradeId,
        traineeAssignID: selectedGrade.traineeAssignID,
        subjectId: selectedGrade.subjectId,
        participantScore: parseFloat(editedGrade.participantScore?.replace(',', '.')) || 0,
        assignmentScore: parseFloat(editedGrade.assignmentScore?.replace(',', '.')) || 0,
        finalExamScore: parseFloat(editedGrade.finalExamScore?.replace(',', '.')) || 0,
        finalResitScore: parseFloat(editedGrade.finalResitScore?.replace(',', '.')) || 0,
        remarks: editedGrade.remarks || ""
      };
      
      console.log("Sending update to Grade/" + updatedGrade.gradeId + ":", JSON.stringify(updatedGrade));
      
      await updateGrade(updatedGrade, token);
      Alert.alert('Success', 'Grade updated successfully');
      setModalVisible(false);
      fetchGrades();
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert('Error', `Failed to update grade: ${err.response?.data?.message || err.message || JSON.stringify(err)}`);
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.tableRow}
      onPress={() => handleCellDoubleClick(item)}
    >
      <Text style={[styles.tableCell, styles.idCell]}>{index + 1}</Text>
      <Text style={[styles.tableCell, styles.subjectCell]}>
        {item.fullname || "N/A"}
      </Text>
      <Text style={[styles.tableCell, styles.scoreCell]}>{item.participantScore || "0"}</Text>
      <Text style={[styles.tableCell, styles.scoreCell]}>{item.assignmentScore || "0"}</Text>
      <Text style={[styles.tableCell, styles.scoreCell]}>{item.finalExamScore || "0"}</Text>
      <Text style={[styles.tableCell, styles.scoreCell]}>{item.finalResitScore || "0"}</Text>
      <Text style={[styles.tableCell, styles.totalCell]}>{item.totalScore || "0"}</Text>
      <Text style={[styles.tableCell, styles.statusCell, 
        { color: item.gradeStatus === "Pass" ? "#4CAF50" : "#F44336" }]}>
        {item.gradeStatus || "N/A"}
      </Text>
    </TouchableOpacity>
  );

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.idCell]}>No</Text>
      <Text style={[styles.headerCell, styles.subjectCell]}>Trainee</Text>
      <Text style={[styles.headerCell, styles.scoreCell]}>Par</Text>
      <Text style={[styles.headerCell, styles.scoreCell]}>Ass</Text>
      <Text style={[styles.headerCell, styles.scoreCell]}>Exa</Text>
      <Text style={[styles.headerCell, styles.scoreCell]}>Res</Text>
      <Text style={[styles.headerCell, styles.totalCell]}>Tot</Text>
      <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
    </View>
  );

  const getFilterButtonText = () => {
    if (!selectedSubject) {
      return 'Chọn môn học';
    }
    return `Môn: ${subjectNames[selectedSubject] || selectedSubject}`;
  };

  const renderSubjectModal = () => (
    <Modal
      transparent={true}
      visible={showSubjectModal}
      animationType="fade"
      onRequestClose={() => setShowSubjectModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn môn học</Text>
          
          <ScrollView style={styles.subjectList}>
            {subjectList.map((subject, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.subjectOption,
                  selectedSubject === subject && styles.selectedSubject
                ]}
                onPress={() => {
                  setSelectedSubject(subject);
                  setShowSubjectModal(false);
                }}
              >
                <Text style={[
                  styles.subjectText,
                  selectedSubject === subject && styles.selectedSubjectText
                ]}>
                  {subjectNames[subject] || subject}
                </Text>
                {selectedSubject === subject && (
                  <FontAwesome name="check" size={18} color="#1D72F3" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setShowSubjectModal(false)}
          >
            <Text style={styles.closeModalButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ImageBackground
      source={BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>View All Grades</Text>
          <View style={styles.rightHeaderSpace} />
        </View>

        {/* Main content */}
        <View style={[styles.mainContainer, { width, height: height * 0.8 }]}>
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
                onPress={fetchGrades}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : grades.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="graduation-cap" size={50} color="#B8C4D1" />
              <Text style={styles.emptyText}>No grades available</Text>
            </View>
          ) : (
            <View style={styles.tableContainer}>
              {/* Subject filter button */}
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowSubjectModal(true)}
              >
                <Text style={styles.filterButtonText}>
                  {getFilterButtonText()}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#43546A" />
              </TouchableOpacity>
              
              <View style={styles.tableWrapper}>
                {renderTableHeader()}
                <FlatList
                  data={filteredGrades}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => `grade-${item.gradeId || index}`}
                  showsVerticalScrollIndicator={true}
                />
              </View>
              
              {/* Export button */}
              <TouchableOpacity
                style={styles.exportButton}
                onPress={exportToExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome name="file-excel-o" size={20} color="white" />
                    <Text style={styles.exportButtonText}>Xuất CSV</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Subject selection modal */}
              {renderSubjectModal()}
            </View>
          )}
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setModalVisible(false);
          }}
        >
          <View>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContent, { transform: [{ scale: modalVisible ? 1 : 0.3 }] }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Update Grade</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalScrollView}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.label}>Participant Score (0-10):</Text>
                  <TextInput
                    style={[styles.input, errors.participantScore ? styles.inputError : null]}
                    value={editedGrade.participantScore}
                    onChangeText={(text) => handleScoreChange('participantScore', text)}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {errors.participantScore ? (
                    <Text style={styles.errorText}>{errors.participantScore}</Text>
                  ) : null}

                  <Text style={styles.label}>Assignment Score (0-10):</Text>
                  <TextInput
                    style={[styles.input, errors.assignmentScore ? styles.inputError : null]}
                    value={editedGrade.assignmentScore}
                    onChangeText={(text) => handleScoreChange('assignmentScore', text)}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {errors.assignmentScore ? (
                    <Text style={styles.errorText}>{errors.assignmentScore}</Text>
                  ) : null}

                  <Text style={styles.label}>Final Exam Score (0-10):</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      errors.finalExamScore ? styles.inputError : null,
                      parseFloat(editedGrade.finalResitScore?.replace(',', '.')) > 0 ? styles.inputDisabled : null
                    ]}
                    value={editedGrade.finalExamScore}
                    onChangeText={(text) => handleScoreChange('finalExamScore', text)}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    editable={!(parseFloat(editedGrade.finalResitScore?.replace(',', '.')) > 0)}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {errors.finalExamScore ? (
                    <Text style={styles.errorText}>{errors.finalExamScore}</Text>
                  ) : null}
                  {parseFloat(editedGrade.finalResitScore?.replace(',', '.')) > 0 && (
                    <Text style={styles.helperText}>Final exam not allowed when resit score exists</Text>
                  )}

                  <Text style={styles.label}>Final Resit Score (0-10):</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      errors.finalResitScore ? styles.inputError : null,
                      parseFloat(editedGrade.finalExamScore?.replace(',', '.')) > 0 ? styles.inputDisabled : null
                    ]}
                    value={editedGrade.finalResitScore}
                    onChangeText={(text) => handleScoreChange('finalResitScore', text)}
                    keyboardType="decimal-pad"
                    maxLength={4}
                    editable={!(parseFloat(editedGrade.finalExamScore?.replace(',', '.')) > 0)}
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  {errors.finalResitScore ? (
                    <Text style={styles.errorText}>{errors.finalResitScore}</Text>
                  ) : null}
                  {parseFloat(editedGrade.finalExamScore?.replace(',', '.')) > 0 && (
                    <Text style={styles.helperText}>Final resit not allowed when exam score exists</Text>
                  )}

                  <Text style={styles.label}>Remarks:</Text>
                  <TextInput
                    style={[styles.input, styles.remarksInput]}
                    value={editedGrade.remarks}
                    onChangeText={(text) => setEditedGrade({...editedGrade, remarks: text})}
                    multiline
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]} 
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSave();
                    }}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                  
                  <View style={{ height: 20 }} /> 
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    position: "relative",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    flex: 1,
  },
  rightHeaderSpace: {
    width: 30,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: "5%",
    paddingVertical: "5%",
    position: "absolute",
    bottom: 0,
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
  tableContainer: {
    flex: 1,
    padding: 0,
  },
  tableWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#43546A",
    paddingVertical: 15,
  },
  headerCell: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 2,
    fontSize: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  tableCell: {
    paddingHorizontal: 2,
    textAlign: "center",
    fontSize: 16,
  },
  idCell: {
    width: "15%",
  },
  subjectCell: {
    width: "20%",
  },
  scoreCell: {
    width: "9%",
  },
  totalCell: {
    width: "9%",
    fontWeight: "bold",
  },
  statusCell: {
    width: "20%",
    fontWeight: "bold",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#43546A",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  exportButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43546A',
    marginBottom: 15,
    textAlign: 'center',
  },
  subjectList: {
    maxHeight: 300,
  },
  subjectOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedSubject: {
    backgroundColor: '#F0F8FF',
  },
  subjectText: {
    fontSize: 16,
    color: '#43546A',
  },
  selectedSubjectText: {
    fontWeight: 'bold',
    color: '#1D72F3',
  },
  closeModalButton: {
    backgroundColor: '#43546A',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 5,
  },
  closeButton: {
    padding: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  remarksInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 10,
    fontStyle: 'italic',
  },
});

export default ViewGrade; 