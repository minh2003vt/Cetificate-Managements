import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { 
  View, Text, TextInput, FlatList, Image, 
  TouchableOpacity, StyleSheet, ImageBackground, ScrollView, ActivityIndicator 
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotifications, getUnreadCount } from "../../services/api";

const Home = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userFullName, setUserFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const fullName = await AsyncStorage.getItem("userFullName");
        const userID = await AsyncStorage.getItem("userId");
        setUserFullName(fullName || "");
        setUserId(userID || "");
        
        // Sau khi lấy được userId, gọi fetchNotifications
        if (userID) {
          fetchNotifications(userID);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);
  
  const fetchNotifications = async (userID) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token || !userID) {
        console.log("Token or UserID not available");
        return;
      }
      
      // Lấy số thông báo chưa đọc
      const unreadResponse = await getUnreadCount(userID, token);
      const unreadTotal = unreadResponse?.unreadTotal || 0;
      setUnreadCount(unreadTotal);
      
      // Lấy tất cả thông báo
      const response = await getNotifications(userID, token);
      
      if (response && response.data && Array.isArray(response.data)) {
        // Sắp xếp theo thời gian tạo (mới nhất lên đầu)
        const sortedNotifications = [...response.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Ưu tiên hiển thị thông báo chưa đọc
        const unreadNotifications = sortedNotifications.filter(note => !note.isRead);
        
        // Lấy 2 thông báo mới nhất (ưu tiên chưa đọc)
        let notificationsToShow = [];
        
        if (unreadNotifications.length >= 2) {
          // Nếu có ít nhất 2 thông báo chưa đọc, hiển thị 2 thông báo đó
          notificationsToShow = unreadNotifications.slice(0, 2);
        } else if (unreadNotifications.length === 1) {
          // Nếu chỉ có 1 thông báo chưa đọc, hiển thị nó và 1 thông báo đã đọc mới nhất
          const readNotifications = sortedNotifications.filter(note => note.isRead);
          notificationsToShow = [unreadNotifications[0]];
          if (readNotifications.length > 0) {
            notificationsToShow.push(readNotifications[0]);
          }
        } else {
          // Nếu không có thông báo chưa đọc, hiển thị 2 thông báo mới nhất
          notificationsToShow = sortedNotifications.slice(0, 2);
        }
        
        // Format thông báo để hiển thị
        const formattedNotifications = notificationsToShow.map(note => {
          // Lấy 50 ký tự đầu tiên của nội dung và thêm dấu "..." nếu dài hơn
          const shortenedMessage = note.message.length > 50
            ? note.message.substring(0, 50) + "..."
            : note.message;
            
          // Format date
          const date = new Date(note.createdAt);
          const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
          
          return {
            id: note.notificationId,
            title: note.title || "Notification",
            date: formattedDate,
            content: shortenedMessage,
            isRead: note.isRead,
            createdAt: note.createdAt
          };
        });
        
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

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
              { title: "Schedule", icon: "calendar", navigateTo: "Schedule" },
              { title: "Notification", icon: "bell", navigateTo: "Notifications", badge: unreadCount > 0 },
              { title: "History", icon: "history", navigateTo: "History" },
              { title: "Course", icon: "graduation-cap", navigateTo: "Courses" },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gridItem}
                onPress={() => navigation.navigate(item.navigateTo)}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome name={item.icon} size={50} color="white" />
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.gridText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Danh sách thông báo */}
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>
              Notifications {unreadCount > 0 ? `(${unreadCount})` : `(${notifications.length})`}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
              <MaterialIcons name="chevron-right" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {notifications.length > 0 ? (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.notificationCard,
                    !item.isRead && styles.unreadNotification
                  ]}
                  onPress={() => navigation.navigate("Notifications")}
                >
                  {!item.isRead && <View style={styles.unreadDot} />}
                  <Text style={styles.notificationCardTitle}>{item.title}</Text>
                  <Text style={styles.notificationDate}>{item.date}</Text>
                  <Text style={styles.notificationContent}>{item.content}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyNotifications}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
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
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    marginBottom: 10,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#1D72F3',
  },
  unreadDot: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
  },
  notificationCardTitle: { fontSize: 16, fontWeight: "bold", color: "white" },
  notificationDate: { fontSize: 12, color: "#DDD", marginBottom: 5 },
  notificationContent: { fontSize: 14, color: "#EEE" },
  emptyNotifications: {
    backgroundColor: "#43546A",
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: "#EEE",
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default Home;
