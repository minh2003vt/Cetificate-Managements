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
  ActivityIndicator
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from '../../context/ThemeContext';
import { getSpecialty } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TrainingPlanDetail = ({ navigation }) => {
  const route = useRoute();
  const { trainingPlan } = route.params;
  const { width, height } = useWindowDimensions();
  const { theme, isDarkMode } = useTheme();
  const [specialty, setSpecialty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [specialtyLoading, setSpecialtyLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSpecialtyData();
  }, []);

  const fetchSpecialtyData = async () => {
    try {
      setSpecialtyLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token found');
      }

      if (trainingPlan.specialtyId) {
        console.log('Fetching specialty with ID:', trainingPlan.specialtyId);
        const specialtyData = await getSpecialty(trainingPlan.specialtyId, token);
        console.log('Specialty data received:', specialtyData);
        
        if (specialtyData) {
          setSpecialty(specialtyData);
          console.log('Specialty set to:', specialtyData);
        } else {
          console.log('No specialty data received');
        }
      } else {
        console.log('No specialtyId in training plan');
      }
    } catch (err) {
      console.error('Error fetching specialty data:', err);
      setError('Failed to load specialty information');
    } finally {
      setSpecialtyLoading(false);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
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
          <Text style={[styles.headerTitle, { color: theme.textUpper }]}>Training Plan Detail</Text>
          <View style={{ width: 24 }}></View>
        </View>

        <ScrollView contentContainerStyle={[styles.contentContainer, { width, height: height * 0.8 }]}>
          <View style={[styles.card, { backgroundColor: theme.contentInfo }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009099" />
                <Text style={[styles.loadingText, { color: theme.text }]}>Loading details...</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.title, { color: theme.text }]}>{trainingPlan.planName}</Text>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Level:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{trainingPlan.planLevel}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Status:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{trainingPlan.status}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Start Date:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{formatDate(trainingPlan.startDate)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>End Date:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{formatDate(trainingPlan.endDate)}</Text>
                </View>

                {/* Specialty section */}
                <View style={[styles.separator, { backgroundColor: theme.border }]} />
                <Text style={[styles.sectionHeader, { color: theme.text }]}>Specialty:</Text>
                
                {specialtyLoading ? (
                  <View style={styles.loadingSpecialty}>
                    <ActivityIndicator size="small" color="#009099" />
                    <Text style={{color: theme.textSecondary, marginLeft: 10}}>Loading specialty...</Text>
                  </View>
                ) : specialty ? (
                  <View style={styles.specialtyContainer}>
                    <Text style={[styles.specialtyName, { color: theme.text }]}>{specialty.specialtyName}</Text>
                    {specialty.description && (
                      <Text style={[styles.specialtyDescription, { color: theme.textSecondary }]}>
                        {specialty.description}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.noSpecialty, { color: theme.textSecondary }]}>
                    No specialty information available for ID: {trainingPlan.specialtyId || 'None'}
                  </Text>
                )}

                {trainingPlan.courses && trainingPlan.courses.length > 0 && (
                  <>
                    <View style={[styles.separator, { backgroundColor: theme.border }]} />
                    
                    <Text style={[styles.sectionHeader, { color: theme.text }]}>Courses:</Text>
                    {trainingPlan.courses.map((course, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.courseContainer}
                        onPress={() => navigation.navigate("CourseDetail", { courseId: course.courseId })}
                      >
                        <FontAwesome name="book" size={18} color={theme.primary} />
                        <View style={styles.courseInfo}>
                          <Text style={[styles.courseName, { color: theme.primary }]}>{course.courseName}</Text>
                          <Text style={[styles.courseLevel, { color: theme.textSecondary }]}>Level: {course.courseLevel}</Text>
                        </View>
                        <FontAwesome name="chevron-right" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchSpecialtyData}>
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
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
    marginBottom: 15,
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
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  specialtyContainer: {
    marginBottom: 15,
  },
  specialtyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  specialtyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  courseContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 144, 153, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  courseInfo: {
    flex: 1,
    marginLeft: 10,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "500",
  },
  courseLevel: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingSpecialty: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  debugContainer: {
    marginBottom: 10,
    padding: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  noSpecialty: {
    fontStyle: 'italic',
    marginBottom: 15,
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
});

export default TrainingPlanDetail;
