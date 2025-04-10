import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  useWindowDimensions,
  ActivityIndicator,
  Modal
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from '../../context/ThemeContext';
import { getCourse } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CourseDetail = ({ navigation }) => {
  const route = useRoute();
  const { courseId, course: passedCourse } = route.params; // Get courseId or course object
  const { width, height } = useWindowDimensions();
  const { theme, isDarkMode } = useTheme();
  const [course, setCourse] = useState(passedCourse || null);
  const [loading, setLoading] = useState(!passedCourse);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);

  useEffect(() => {
    if (courseId && !passedCourse) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token found');
      }

      const courseData = await getCourse(courseId, token);
      if (courseData) {
        setCourse({
          title: courseData.courseName,
          progress: courseData.progress || 'Not started',
          type: courseData.courseLevel,
          description: courseData.description || 'No description available',
          subjects: courseData.subjects || []
        });
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError('Failed to load course information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={isDarkMode 
        ? require("../../../assets/Background-Dark.png")
        : require("../../../assets/Background-homepage.png")
      }
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ color: theme.textUpper }}>
            <FontAwesome name="arrow-left" size={24} style={{ color: theme.textUpper }}/>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textUpper }]}>Course Detail</Text>
          <View style={{ width: 24 }}></View>
        </View>

        <ScrollView contentContainerStyle={[styles.contentContainer, { width, height: height * 0.8 }]}>
          <View style={[styles.card, { backgroundColor: theme.contentInfo }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009099" />
                <Text style={[styles.loadingText, { color: theme.text }]}>Loading course details...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCourseData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : course ? (
              <>
                <Text style={[styles.title, { color: theme.text }]}>{course.title}</Text>
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Progress:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{course.progress}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Course Type:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{course.type}</Text>
                </View>

                <View style={[styles.separator, { backgroundColor: theme.border }]} />

                <Text style={[styles.descriptionHeader, { color: theme.text }]}>Description:</Text>
                <Text style={[styles.description, { color: theme.text }]}>{course.description}</Text>

                <Text style={[styles.subjectHeader, { color: theme.text }]}>Course's subjects:</Text>
                {course.subjects && course.subjects.length > 0 ? (
                  course.subjects.map((subject, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.subjectContainer}
                      onPress={() => {
                        setSelectedSubject(subject);
                        setSubjectModalVisible(true);
                      }}
                    >
                      <FontAwesome name="book" size={18} color={theme.primary} />
                      <Text style={[styles.subject, { color: theme.primary }]}>{subject.subjectName}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.noSubjects, { color: theme.textSecondary }]}>No subjects available</Text>
                )}
              </>
            ) : (
              <Text style={[styles.errorText, { color: theme.text }]}>Course not found</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Subject Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={subjectModalVisible}
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.contentInfo }]}>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalInnerContent}>
                {selectedSubject ? (
                  <>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedSubject.subjectName}</Text>
                    
                    <View style={[styles.infoRow, {width: '100%'}]}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Credits:</Text>
                      <Text style={[styles.info, { color: theme.text }]}>{selectedSubject.credits || 0}</Text>
                    </View>
                    
                    <View style={[styles.infoRow, {width: '100%'}]}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Passing Score:</Text>
                      <Text style={[styles.info, { color: theme.text }]}>{selectedSubject.passingScore || 0}</Text>
                    </View>

                    <View style={[styles.separator, { backgroundColor: theme.border, width: '100%' }]} />

                    <Text style={[styles.descriptionHeader, { color: theme.text, width: '100%', textAlign: 'left' }]}>Description:</Text>
                    <Text style={[styles.modalBody, { color: theme.text }]}>
                      {selectedSubject.description || "No description available"}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.errorText, { color: theme.text }]}>Subject not found</Text>
                )}
              </View>
            </ScrollView>
            <TouchableOpacity 
              onPress={() => setSubjectModalVisible(false)} 
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalScrollView: {
    maxHeight: "100%",
    width: '100%',
  },
  modalInnerContent: {
    alignItems: "center",
    paddingBottom: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "left",
    width: '100%',
    flexWrap: 'wrap',
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
    flexWrap: 'wrap',
  },
  closeButton: {
    backgroundColor: "#f65858",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    padding: 15,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  errorText: {
    color: "#FF6B6B",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#009099",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noSubjects: {
    fontStyle: 'italic',
    marginTop: 10,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  contentContainer: {
    flexGrow: 1,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
    paddingBottom: 40,
    minHeight: "100%",
    marginTop: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  info: {
    fontSize: 16,
    color: "#333",
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  subjectHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subjectContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  subject: {
    fontSize: 16,
    color: "#1E90FF",
    marginLeft: 8,
  },
});

export default CourseDetail;
