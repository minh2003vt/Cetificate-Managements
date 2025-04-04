import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { 
  View, Text, TextInput, FlatList, Image, 
  TouchableOpacity, StyleSheet, ImageBackground, ScrollView, ActivityIndicator 
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Home = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [userFullName, setUserFullName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const fullName = await AsyncStorage.getItem("userFullName");
        setUserFullName(fullName || "");
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    
    setNotifications([
      { id: "1", title: "New Course Incoming", date: "02/12/2025", content: "New course arrangements have been made for you: FIl..." },
      { id: "2", title: "New Certificate Received", date: "12/12/2024", content: "You've just gotten a new certificate: The Certificate of tra..." },
    ]);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1D72F3" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require("../../../assets/Background-homepage.png")} 
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.username}>{userFullName}</Text>
            </View>
            <Image 
              source={require("../../../assets/default-avatar.png")}
              style={styles.avatar} 
            />
          </View>

          {/* Thanh tìm kiếm */}
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search certificates..." 
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity style={styles.dropdownButton}>
              <MaterialIcons name="arrow-drop-down" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Các ô chức năng */}
<View style={styles.gridContainer}>
  {[
    { title: "Schedule", icon: "calendar", navigateTo: "Schedule" }, // Navigate to Schedule
    { title: "Notification", icon: "bell", navigateTo: "Notification" },
    { title: "History", icon: "history", navigateTo: "History" },
    { title: "Course", icon: "graduation-cap", navigateTo: "Courses" },
  ].map((item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.gridItem}
      onPress={() => navigation.navigate(item.navigateTo)}
    >
      <FontAwesome name={item.icon} size={50} color="white" />
      <Text style={styles.gridText}>{item.title}</Text>
    </TouchableOpacity>
  ))}
</View>


          {/* Danh sách thông báo */}
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Notifications ({notifications.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Notification")}>
              <MaterialIcons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.notificationCard}>
                <Text style={styles.notificationCardTitle}>{item.title}</Text>
                <Text style={styles.notificationDate}>{item.date}</Text>
                <Text style={styles.notificationContent}>{item.content}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 20,
  },

  // Header
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 10 
  },
  greeting: { fontSize: 18, fontWeight: "300", color: "#fff" },
  username: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  avatar: { width: 50, height: 50, borderRadius: 25 },

  // Thanh tìm kiếm
  searchContainer: { 
    flexDirection: "row", 
    backgroundColor: "white", 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 15 
  },
  searchInput: { flex: 1, fontSize: 16 },
  dropdownButton: { marginLeft: 5 },

  // Lưới các chức năng
  gridContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginBottom: 15 
  },
  gridItem: { 
    width: "48%", 
    borderWidth: 2,
    borderColor: "black",
    backgroundColor: "#43546A", 
    borderRadius: 10, 
    padding: 20, 
    alignItems: "center", 
    marginBottom: 10 
  },
  gridText: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "bold", 
    marginTop: 10 
  },

  // Header Notifications
  notificationHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 10 
  },
  notificationTitle: { fontSize: 18, fontWeight: "bold" },

  // Danh sách thông báo
  notificationCard: { 
    backgroundColor: "#43546A", 
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 10 
  },
  notificationCardTitle: { fontSize: 16, fontWeight: "bold", color: "white" },
  notificationDate: { fontSize: 12, color: "#DDD", marginBottom: 5 },
  notificationContent: { fontSize: 14, color: "#EEE" },
});

export default Home;
