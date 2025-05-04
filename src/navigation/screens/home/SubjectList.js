import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import { fetchSubjects } from '../../../services/api';

const SubjectList = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (!token || !userId) {
        throw new Error('Authentication required');
      }

      // Sử dụng hàm fetchSubjects từ api.js
      const allSubjects = await fetchSubjects(token);
      
      // Lọc danh sách các môn học mà người dùng hiện tại giảng dạy
      const instructorSubjects = allSubjects.filter(subject => 
        subject.instructors && subject.instructors.some(instructor => 
          instructor.instructorId === userId && instructor.requestStatus === "Approved"
        )
      );
      
      setSubjects(instructorSubjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubjects();
  };

  const renderItem = ({ item }) => {
    // Lấy thông tin lịch học đầu tiên (nếu có)
    const schedule = item.trainingSchedules && item.trainingSchedules.length > 0 
      ? item.trainingSchedules[0] 
      : null;

    let status = schedule ? schedule.status : 'No Schedule';
    // Thay thế Incoming bằng Approved
    if (status === 'Incoming') {
      status = 'Approved';
    }
    
    const startDate = schedule ? formatDate(schedule.startDateTime) : 'N/A';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('SubjectDetail', { subjectId: item.subjectId })}
      >
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.subjectName}</Text>
          <Text style={styles.subtitle}>ID: {item.subjectId}</Text>
          <Text style={styles.date}>Start date: {startDate}</Text>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.status, 
              status === 'Approved' ? styles.statusApproved : 
              status === 'Pending' ? styles.statusPending : 
              styles.statusOther
            ]}>
              {status}
            </Text>
          </View>
        </View>
        <FontAwesome name="chevron-right" size={20} color="#fff" />
      </TouchableOpacity>
    );
  };

  const NoSubjectsView = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="book" size={50} color="#B8C4D1" />
      <Text style={styles.emptyText}>You don't have any subjects assigned</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={BACKGROUND_HOMEPAGE}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Subjects</Text>
          </View>

          {/* Lista de materias */}
          <View style={[styles.listContainer, { width, height: height * 0.8 }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1D72F3" />
                <Text style={styles.loadingText}>Loading subjects...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={50} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadSubjects}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : subjects.length === 0 ? (
              <NoSubjectsView />
            ) : (
              <FlatList
                data={subjects}
                keyExtractor={(item) => item.subjectId}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#1D72F3"]}
                  />
                }
              />
            )}
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
    fontSize: 14,
    color: "#B8C4D1",
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 5,
  },
  status: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  statusPending: {
    backgroundColor: '#FFC107',
    color: 'black',
  },
  statusOther: {
    backgroundColor: '#78909C',
    color: 'white',
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
  refreshButton: {
    backgroundColor: "#1D72F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default SubjectList; 