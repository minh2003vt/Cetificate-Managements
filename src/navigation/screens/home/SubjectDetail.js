import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import { getSubject, getSubjectTrainees } from '../../../services/api';

const SubjectDetail = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const { subjectId } = route.params;
  const [subject, setSubject] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSubjectData();
  }, []);

  const loadSubjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch subject details and trainees in parallel
      const [subjectData, traineesData] = await Promise.all([
        getSubject(subjectId, token),
        getSubjectTrainees(subjectId, token)
      ]);
      
      setSubject(subjectData);
      setTrainees(traineesData);
    } catch (err) {
      console.error('Error loading subject data:', err);
      setError('Failed to load subject data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const time = timeString.split(':');
    return `${time[0]}:${time[1]}`;
  };

  // Render trainee item
  const renderTraineeItem = ({ item }) => (
    <View style={styles.traineeCard}>
      <View style={styles.traineeInfo}>
        <Text style={styles.traineeName}>{item.name || 'Unnamed Trainee'}</Text>
        <Text style={styles.traineeEmail}>{item.email || 'No email'}</Text>
        <Text style={styles.traineeId}>ID: {item.traineeId || 'Unknown'}</Text>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={BACKGROUND_HOMEPAGE}
          style={styles.background}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Subject Details</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={[styles.contentContainer, { width, height: height * 0.85 }]}>
              <ActivityIndicator size="large" color="#1D72F3" />
              <Text style={styles.loadingText}>Loading subject data...</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={BACKGROUND_HOMEPAGE}
          style={styles.background}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Subject Details</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={[styles.contentContainer, { width, height: height * 0.85 }]}>
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={50} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadSubjectData}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  }

  // No data state
  if (!subject) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={BACKGROUND_HOMEPAGE}
          style={styles.background}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Subject Details</Text>
              <View style={styles.placeholder} />
            </View>
            <View style={[styles.contentContainer, { width, height: height * 0.85 }]}>
              <View style={styles.errorContainer}>
                <FontAwesome name="info-circle" size={50} color="#43546A" />
                <Text style={styles.emptyText}>No subject data available</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  }

  // Main render with data
  return (
    <View style={styles.container}>
      <ImageBackground
        source={BACKGROUND_HOMEPAGE}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subject Details</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={[styles.contentContainer, { width, height: height * 0.85 }]}>
            <ScrollView style={styles.scrollContainer}>
              {/* Subject Details Card */}
              <View style={styles.detailCard}>
                <Text style={styles.subjectName}>{subject.subjectName}</Text>
                <Text style={styles.subjectId}>ID: {subject.subjectId}</Text>
                
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Credits:</Text>
                    <Text style={styles.infoValue}>{subject.credits}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Passing Score:</Text>
                    <Text style={styles.infoValue}>{subject.passingScore}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{subject.description || 'No description available'}</Text>
                
                {/* Schedule Information */}
                {subject.trainingSchedules && subject.trainingSchedules.length > 0 ? (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Schedule</Text>
                    {subject.trainingSchedules.map((schedule, index) => (
                      <View key={index} style={styles.scheduleItem}>
                        <View style={styles.scheduleRow}>
                          <View style={styles.scheduleField}>
                            <Text style={styles.fieldLabel}>Dates:</Text>
                            <Text style={styles.fieldValue}>
                              {formatDate(schedule.startDateTime)} - {formatDate(schedule.endDateTime)}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.scheduleRow}>
                          <View style={styles.scheduleField}>
                            <Text style={styles.fieldLabel}>Days:</Text>
                            <Text style={styles.fieldValue}>{schedule.daysOfWeek}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.scheduleRow}>
                          <View style={styles.scheduleField}>
                            <Text style={styles.fieldLabel}>Time:</Text>
                            <Text style={styles.fieldValue}>{formatTime(schedule.classTime)} ({schedule.subjectPeriod})</Text>
                          </View>
                        </View>
                        
                        <View style={styles.scheduleRow}>
                          <View style={styles.scheduleField}>
                            <Text style={styles.fieldLabel}>Location:</Text>
                            <Text style={styles.fieldValue}>{schedule.location}, Room {schedule.room}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.scheduleStatus}>
                          <Text style={[
                            styles.statusText,
                            schedule.status === 'Incoming' ? styles.statusApproved :
                            schedule.status === 'Ongoing' ? styles.statusOngoing :
                            schedule.status === 'Completed' ? styles.statusCompleted :
                            styles.statusDefault
                          ]}>
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                ) : null}
              </View>
              
              {/* Trainees Section */}
              <View style={styles.traineesContainer}>
                <Text style={styles.traineesTitle}>Trainees ({trainees.length})</Text>
                
                {trainees.length === 0 ? (
                  <View style={styles.emptyTrainees}>
                    <FontAwesome name="users" size={30} color="#B8C4D1" />
                    <Text style={styles.emptyTraineesText}>No trainees enrolled in this subject</Text>
                  </View>
                ) : (
                  <FlatList
                    data={trainees}
                    renderItem={renderTraineeItem}
                    keyExtractor={(item, index) => item.traineeId || `trainee-${index}`}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: "5%",
    paddingTop: "5%",
    position: "absolute",
    bottom: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#43546A",
    marginBottom: 5,
  },
  subjectId: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#43546A",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#43546A",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  scheduleItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  scheduleRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  scheduleField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    color: "#333",
  },
  scheduleStatus: {
    marginTop: 8,
    alignItems: "flex-end",
  },
  statusText: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
  },
  statusApproved: {
    backgroundColor: "#4CAF50",
    color: "white",
  },
  statusOngoing: {
    backgroundColor: "#4CAF50",
    color: "white",
  },
  statusCompleted: {
    backgroundColor: "#43546A",
    color: "white",
  },
  statusDefault: {
    backgroundColor: "#78909C",
    color: "white",
  },
  traineesContainer: {
    marginBottom: 20,
  },
  traineesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#43546A",
    marginBottom: 15,
  },
  traineeCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  traineeInfo: {
    flex: 1,
  },
  traineeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#43546A",
    marginBottom: 2,
  },
  traineeEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  traineeId: {
    fontSize: 12,
    color: "#888",
  },
  emptyTrainees: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  emptyTraineesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
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
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#43546A",
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
});

export default SubjectDetail; 