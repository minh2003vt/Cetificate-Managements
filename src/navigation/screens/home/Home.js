import React, { useState, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { 
  View, Text, TextInput, FlatList, Image, 
  TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, Alert,
  Dimensions, Platform, LogBox
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotifications, getUnreadCount } from "../../../services/api";
import { EventRegister } from "react-native-event-listeners";
import { BACKGROUND_HOMEPAGE, DEFAULT_AVATAR } from "../../../utils/assets";
import { verifyAccountStatus } from "../../../utils/accountStatus";

// Bỏ qua cảnh báo về VirtualizedList lồng nhau
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested', 
  'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead. [Component Stack]'
]);

const { width: screenWidth } = Dimensions.get('window');
const aspectRatio = 430 / 346; // height / width

const Home = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userFullName, setUserFullName] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const { height } = useWindowDimensions();
  const [userRole, setUserRole] = useState("");
  const [isInstructor, setIsInstructor] = useState(false);

  // Hàm kiểm tra vai trò giảng viên
  const checkInstructorRole = (role) => {
    if (!role) return false;
    
    const roleLower = role.toLowerCase();
    const isTeacher = roleLower.includes('instructor') || 
                      roleLower.includes('teacher') ||
                      roleLower === 'trainer';
    
    return isTeacher;
  };

  // Kiểm tra tất cả các key trong AsyncStorage
  const checkAllStorageKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();

      // Kiểm tra dữ liệu userInfo
      const userInfo = await AsyncStorage.getItem("userInfo");
      
      if (userInfo) {
        try {
          const parsedInfo = JSON.parse(userInfo);
          
          if (parsedInfo.role) {
            const isTeacher = checkInstructorRole(parsedInfo.role);
            setUserRole(parsedInfo.role);
            setIsInstructor(isTeacher);
          }
        } catch (e) {
          console.error('[Home] Error parsing userInfo:', e);
        }
      }
      
      // Kiểm tra dữ liệu userRole trực tiếp
      const directRole = await AsyncStorage.getItem("userRole");
      if (directRole) {
        const isTeacher = checkInstructorRole(directRole);
        setUserRole(directRole);
        setIsInstructor(isTeacher);
      }
    } catch (error) {
      console.error('[Home] Error checking AsyncStorage:', error);
    }
  };

  const loadUserData = async () => {
    try {
      // Kiểm tra trạng thái tài khoản trước khi tải dữ liệu
      const isActive = await verifyAccountStatus();
      if (!isActive) return;

      const fullName = await AsyncStorage.getItem("userFullName");
      const userID = await AsyncStorage.getItem("userId");
      const avatarUrl = await AsyncStorage.getItem("userAvatar");
      
      setUserFullName(fullName || "");
      setUserId(userID || "");
      if (avatarUrl) {
        setUserAvatar(avatarUrl);
      }
      
      // Kiểm tra vai trò người dùng từ nhiều nguồn
      await checkAllStorageKeys();
      
      // Sau khi lấy được userId, gọi fetchNotifications
      if (userID) {
        fetchNotifications(userID);
      }
    } catch (error) {
      console.error("[Home] Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();

    // Lắng nghe sự kiện đăng nhập
    const loginListener = EventRegister.addEventListener(
      'userLoggedIn',
      (data) => {
        setTimeout(() => {
          loadUserData();
        }, 1000);
      }
    );

    // Đăng ký listeners cho các sự kiện thông báo
    const notificationReadListener = EventRegister.addEventListener(
      'notificationRead',
      () => {
        // Khi có thông báo được đọc, cập nhật lại danh sách thông báo
        if (userId) {
          // Kiểm tra trạng thái tài khoản trước khi tải thông báo
          verifyAccountStatus(() => {
            fetchNotifications(userId);
          });
        }
      }
    );

    const updateNotificationCountListener = EventRegister.addEventListener(
      'updateNotificationCount',
      (data) => {
        // Cập nhật số lượng thông báo chưa đọc
        setUnreadCount(data.unreadCount || 0);
        // Tải lại thông báo nếu cần
        if (userId) {
          // Kiểm tra trạng thái tài khoản trước khi tải thông báo
          verifyAccountStatus(() => {
            fetchNotifications(userId);
          });
        }
      }
    );

    const newNotificationListener = EventRegister.addEventListener(
      'newNotification',
      () => {
        // Khi có thông báo mới, cập nhật lại danh sách
        if (userId) {
          // Kiểm tra trạng thái tài khoản trước khi tải thông báo
          verifyAccountStatus(() => {
            fetchNotifications(userId);
          });
        }
      }
    );

    // Cleanup function
    return () => {
      EventRegister.removeEventListener(loginListener);
      EventRegister.removeEventListener(notificationReadListener);
      EventRegister.removeEventListener(updateNotificationCountListener);
      EventRegister.removeEventListener(newNotificationListener);
    };
  }, [userId]); // Thêm userId vào dependency array
  
  // Thêm useEffect cho userRole
  useEffect(() => {
    // Kiểm tra lại vai trò mỗi khi userRole thay đổi
    const isTeacher = checkInstructorRole(userRole);
    setIsInstructor(isTeacher);
  }, [userRole]);
  
  const fetchNotifications = async (userID) => {
    try {
      // Kiểm tra trạng thái tài khoản trước khi tải thông báo
      const isActive = await verifyAccountStatus();
      if (!isActive) return;

      const token = await AsyncStorage.getItem("userToken");
      if (!token || !userID) {
        console.log("Token or UserID not available");
        return;
      }
      
      // Lấy số thông báo chưa đọc
      try {
        const unreadResponse = await getUnreadCount(userID, token);
        const unreadTotal = unreadResponse?.unreadCount || 0;
        setUnreadCount(unreadTotal);
      } catch (unreadError) {
        setUnreadCount(0);
      }
      
      // Lấy tất cả thông báo
      const response = await getNotifications(userID, token);
      
      if (response && response.data && Array.isArray(response.data)) {
        // Sắp xếp theo thời gian tạo (mới nhất lên đầu)
        const sortedNotifications = [...response.data].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Tách thông báo thành đã đọc và chưa đọc
        const unreadNotifications = sortedNotifications.filter(note => !note.isRead);
        const readNotifications = sortedNotifications.filter(note => note.isRead);
        
        // Chọn thông báo hiển thị theo quy tắc mới
        let notificationsToShow = [];
        
        if (unreadNotifications.length >= 2) {
          // Nếu có từ 2 thông báo chưa đọc trở lên, hiển thị 2 thông báo chưa đọc mới nhất
          notificationsToShow = unreadNotifications.slice(0, 2);
        } else if (unreadNotifications.length === 1) {
          // Nếu chỉ có 1 thông báo chưa đọc, hiển thị nó và 1 thông báo đã đọc mới nhất
          notificationsToShow.push(unreadNotifications[0]);
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
          const shortenedMessage = note.message && note.message.length > 50
            ? note.message.substring(0, 50) + "..."
            : note.message || '';
            
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
        
        // Cập nhật state
        setNotifications(formattedNotifications);
      } else {
        // Nếu không có thông báo, đặt mảng rỗng
        setNotifications([]);
      }
    } catch (error) {
      // Ghi nhật ký lỗi nhưng không hiển thị thông báo lỗi cho người dùng
      console.log("Error in fetchNotifications:", error?.message || "Unknown error");
      setNotifications([]);
    }
  };

  // Thêm useFocusEffect để tải lại dữ liệu khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      // Kiểm tra trạng thái tài khoản trước khi tải dữ liệu
      verifyAccountStatus(() => {
        loadUserData();
      });
      return () => {
        // Cleanup nếu cần
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Image source={BACKGROUND_HOMEPAGE} style={styles.backgroundImage} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D72F3" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={BACKGROUND_HOMEPAGE} style={styles.backgroundImage} />
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{userFullName}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Image 
            source={userAvatar ? { uri: userAvatar } : DEFAULT_AVATAR}
            style={styles.avatar} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.contentWrapper}>
          {/* Các ô chức năng */}
          <View style={styles.gridContainer}>
            {[
              { title: "Schedule", icon: "calendar", navigateTo: "Schedule" },
              { title: "Notification", icon: "bell", navigateTo: "Notifications", badge: unreadCount > 0 },
              { 
                title: isInstructor ? "Import Score" : "History", 
                icon: isInstructor ? "file-excel-o" : "history", 
                navigateTo: isInstructor ? "ImportScore" : "History" 
              },
              { 
                title: "Grade", 
                icon: "graduation-cap", 
                navigateTo: isInstructor ? "ViewGrade" : "Grade" 
              },
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
            <View style={styles.notificationList}>
              {notifications.map(item => (
                <TouchableOpacity
                  key={item.id.toString()}
                  style={styles.notificationCard}
                  onPress={() => navigation.navigate("Notifications")}
                >
                  {!item.isRead && <View style={styles.redDotIndicator} />}
                  <View style={styles.notificationInner}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                    <Text style={styles.cardContent}>{item.content}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyNotifications}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backgroundImage: {
    width: "100%",
    height: screenWidth / aspectRatio,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    resizeMode: "cover",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.select({
      ios: 60,
      android: 40
    }),
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    flexDirection: "column",
  },
  greeting: { 
    fontSize: 18, 
    color: "white" 
  },
  username: { 
    fontSize: 30, 
    fontWeight: "bold", 
    color: "white" 
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25 
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    paddingBottom: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: { 
    flexDirection: "row", 
    backgroundColor: "white", 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 15 
  },
  searchInput: { flex: 1, fontSize: 16 },
  dropdownButton: { marginLeft: 5 },
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
  notificationHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 10 
  },
  notificationTitle: { 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  notificationList: {
    maxHeight: Dimensions.get('window').height * 0.25,
  },
  notificationCard: { 
    backgroundColor: "white", 
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: 'hidden',
    position: 'relative',
  },
  redDotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  notificationInner: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  emptyNotifications: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  emptyText: {
    color: "#777",
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default Home;
