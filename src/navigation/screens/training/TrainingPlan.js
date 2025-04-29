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
import { getTrainingPlanUser } from '../../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../context/ThemeContext';
import { BACKGROUND_HOMEPAGE, BACKGROUND_DARK } from '../../../utils/assets';

const TrainingPlan = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme, isDarkMode } = useTheme();
  const [noPlansMessage, setNoPlansMessage] = useState(null);

  useEffect(() => {
    fetchTrainingPlans();
  }, []);

  const fetchTrainingPlans = async () => {
    try {
      setLoading(true);
      setNoPlansMessage(null);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await getTrainingPlanUser(token);      
      // Check if response contains the specific message for no joined plans
      if (response && response.message === 'No training plan joined.') {
        console.log('No training plans joined message received');
        setNoPlansMessage('U havent added to any training plan');
        setTrainingPlans([]);
        return;
      }
      
      // Check for different response structures
      let plansData = [];
      
      if (response && response.plans && Array.isArray(response.plans)) {
        console.log('Found plans property with length:', response.plans.length);
        plansData = response.plans;
      } else if (response && Array.isArray(response)) {
        console.log('Response is an array with length:', response.length);
        plansData = response;
      } else if (response && response.message && response.plans) {
        // This matches the structure you shared
        console.log('Found message and plans structure with length:', response.plans.length);
        plansData = response.plans;
      } else if (response && response.data && Array.isArray(response.data)) {
        console.log('Found data array with length:', response.data.length);
        plansData = response.data;
      } else {
        console.log('No recognized structure found, attempting to use raw response');
        // Last resort - try to use the response directly
        plansData = response;
      }
      
      console.log('Final plansData:', plansData);
      console.log('Plans count:', Array.isArray(plansData) ? plansData.length : 'Not an array');
      
      if (Array.isArray(plansData) && plansData.length > 0) {
        // Lọc chỉ những kế hoạch đào tạo có trạng thái "Approved"
        const approvedPlans = plansData.filter(plan => plan.trainingPlanStatus !== 'Draft');
        
        const processedPlans = processTrainingPlans(approvedPlans);
        setTrainingPlans(processedPlans);
      } else {
        console.warn('No training plans found in response');
        setTrainingPlans([]);
      }
    } catch (err) {
      console.error('Error fetching training plans:', err);
      if (err.message && err.message.includes('No training plan joined')) {
        setNoPlansMessage('You havent been assigned to any training plan yet.');
        setTrainingPlans([]);
      } else {
        setError('Failed to load training plans');
      }
    } finally {
      setLoading(false);
    }
  };

  const processTrainingPlans = (plans) => {
    return plans.map(plan => {
      // Calculate progress status based on dates
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);
      const currentDate = new Date();
    
      let status;
      let displayDate;
      let iconName;
      let iconColor;
      
      if (plan.trainingPlanStatus === 'Completed') {
        status = "Completed";
        displayDate = `Completed at: ${formatDate(endDate)}`;
        iconName = "check-circle";
        iconColor = "#4CAF50"; // Green
      } else if (currentDate < startDate) {
        status = "Not yet";
        displayDate = `Start at: ${formatDate(startDate)}`;
        iconName = "clock-o";
        iconColor = "#FFD700"; // Gold
      } else if (currentDate > endDate) {
        status = "Completed";
        displayDate = `Completed at: ${formatDate(endDate)}`;
        iconName = "check-circle";
        iconColor = "#4CAF50"; // Green
      } else {
        status = "Ongoing";
        displayDate = `In progress`;
        iconName = "play-circle";
        iconColor = "#FFFFFF"; // White
      }
      
      // Luôn trả về kế hoạch, không lọc dựa trên trạng thái
      return {
        ...plan,
        status,
        displayDate,
        iconName,
        iconColor
      };
    });
  };

  const formatDate = (date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <ImageBackground
        source={isDarkMode 
          ? BACKGROUND_DARK
          : BACKGROUND_HOMEPAGE
        }
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#009099" />
          <Text style={styles.loadingText}>Loading training plans...</Text>
        </View>
      </ImageBackground>
    );
  }

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Training Plans</Text>
        </View>

        {/* List of training plans */}
        <View style={[styles.listContainer, { width, height: height * 0.8 }]}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchTrainingPlans}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : trainingPlans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="info-circle" size={50} color="#009099" />
              <Text style={styles.emptyText}>
                {noPlansMessage || "No training plans found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={trainingPlans}
              keyExtractor={(item) => item.planId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("TrainingPlanDetail", { trainingPlan: item });
                  }}
                >
                  <View style={styles.card}>
                    <View style={styles.cardContent}>
                      <Text style={styles.title}>{item.planName}</Text>
                      <Text style={styles.level}>Level: {item.planLevel}</Text>
                      <Text style={styles.date}>{item.displayDate}</Text>
                    </View>
                    <FontAwesome
                      name={item.iconName}
                      size={30}
                      color={item.iconColor}
                      style={styles.icon}
                    />
                  </View>
                </TouchableOpacity>
              )}
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
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
  level: {
    fontSize: 14,
    color: "#E0E0E0",
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: "#B8C4D1",
    marginTop: 4,
  },
  icon: {
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#009099',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#43546A',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default TrainingPlan;
