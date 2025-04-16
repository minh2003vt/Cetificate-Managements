import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  useWindowDimensions,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from '../../../context/ThemeContext';
import { getSubject } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_HOMEPAGE, BACKGROUND_DARK } from '../../../utils/assets';

const Subject = ({ navigation }) => {
  const route = useRoute();
  const { subjectId, subject: passedSubject } = route.params;
  const { width, height } = useWindowDimensions();
  const { theme, isDarkMode } = useTheme();
  const [subject, setSubject] = useState(passedSubject || null);
  const [loading, setLoading] = useState(!passedSubject);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have the subject data passed from CourseDetail, use it
    if (passedSubject) {
      console.log('Using passed subject data:', passedSubject);
      setSubject(passedSubject);
      setLoading(false);
    } else if (subjectId) {
      // Only fetch if we don't have the subject data but have an ID
      fetchSubjectData();
    } else {
      setError('No subject information provided');
      setLoading(false);
    }
  }, [passedSubject, subjectId]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token found');
      }

      console.log('Fetching subject with ID:', subjectId);
      const subjectData = await getSubject(subjectId, token);
      console.log('Subject data received:', subjectData);
      
      if (subjectData) {
        setSubject(subjectData);
      } else {
        setError('No subject data found');
      }
    } catch (err) {
      console.error('Error fetching subject data:', err);
      setError('Failed to load subject information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={isDarkMode 
        ? BACKGROUND_DARK
        : BACKGROUND_HOMEPAGE
      }
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ color: theme.textUpper }}>
            <FontAwesome name="arrow-left" size={24} style={{ color: theme.textUpper }}/>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textUpper }]}>Subject Detail</Text>
          <View style={{ width: 24 }}></View>
        </View>

        <ScrollView contentContainerStyle={[styles.contentContainer, { width, height: height * 0.8 }]}>
          <View style={[styles.card, { backgroundColor: theme.contentInfo }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009099" />
                <Text style={[styles.loadingText, { color: theme.text }]}>Loading subject details...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchSubjectData}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : subject ? (
              <>
                <Text style={[styles.title, { color: theme.text }]}>{subject.subjectName}</Text>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Credits:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{subject.credits || 0}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Passing Score:</Text>
                  <Text style={[styles.info, { color: theme.text }]}>{subject.passingScore || 0}</Text>
                </View>

                <View style={[styles.separator, { backgroundColor: theme.border }]} />

                <Text style={[styles.descriptionHeader, { color: theme.text }]}>Description:</Text>
                <Text style={[styles.description, { color: theme.text }]}>
                  {subject.description || "No description available"}
                </Text>
              </>
            ) : (
              <Text style={[styles.errorText, { color: theme.text }]}>Subject not found</Text>
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
  descriptionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
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
  studyButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  studyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009099',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '80%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  studyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Subject;
