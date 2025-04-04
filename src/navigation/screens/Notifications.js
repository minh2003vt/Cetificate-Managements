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
  TextInput,
  Modal,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications, markAsRead } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

const Notification = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [searchText, setSearchText] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const showNotificationToast = (title, message) => {
    const truncatedTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;

    Toast.show({
      type: 'info',
      text1: truncatedTitle,
      text2: truncatedMessage,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
    });
  };

  const fetchNotifications = async (showToast = true) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      if (!userId || !token) {
        throw new Error('User not authenticated');
      }

      const response = await getNotifications(userId, token);
      if (response.data) {
        const sortedNotifications = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Show toast for new notifications only if showToast is true and there are new notifications
        if (showToast && sortedNotifications.length > 0 && !refreshing) {
          const newestNotification = sortedNotifications[0];
          const currentTime = new Date();
          
          // Check if this is a new notification since last fetch
          if (!lastFetchTime || new Date(newestNotification.createdAt) > lastFetchTime) {
            showNotificationToast(newestNotification.title, newestNotification.message);
          }
        }
        
        setNotifications(sortedNotifications);
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Đặt notifications thành mảng rỗng khi có lỗi
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch on initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Don't show toast when returning to screen
      fetchNotifications(false);
      
      // Optional: Set up periodic refresh while screen is focused
      const refreshInterval = setInterval(() => {
        fetchNotifications(true);
      }, 30000); // Refresh every 30 seconds

      return () => {
        // Clean up interval when screen loses focus
        clearInterval(refreshInterval);
      };
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, []);

  const handleNotificationPress = async (notification) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!notification.isRead) {
        await markAsRead(notification.notificationId, token);
        // Update the local notifications list
        setNotifications(prevNotifications => 
          prevNotifications.map(item => 
            item.notificationId === notification.notificationId 
              ? { ...item, isRead: true }
              : item
          )
        );
      }
      setSelectedNotification(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = notifications.filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Tính khoảng cách thời gian theo phút, sử dụng thời gian địa phương
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Vừa xong';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} giờ trước`;
    } else if (diffInMinutes < 48 * 60) {
      return `Hôm qua lúc ${date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      })}`;
    } else {
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  const NoNotificationsView = () => (
    <View style={styles.noNotificationsContainer}>
      <FontAwesome name="bell-slash" size={50} color="#B8C4D1" />
      <Text style={styles.noNotificationsText}>No notifications found</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            placeholderTextColor="#B8C4D1"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <FontAwesome name="times" size={20} color="#f65858" style={styles.clearIcon} />
            </TouchableOpacity>
          ) : (
            <FontAwesome name="search" size={20} color="#B8C4D1" style={styles.searchIcon} />
          )}
        </View>

        {/* Notifications List */}
        <View style={[styles.listContainer, { width, height: height * 0.8, paddingTop: 20 }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1D72F3" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <NoNotificationsView />
          ) : searchText && filteredNotifications.length === 0 ? (
            <Text style={styles.noResultText}>
              No results found for "{searchText}"
            </Text>
          ) : (
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item) => item.notificationId.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#1D72F3"]}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleNotificationPress(item)}>
                  <View style={[
                    styles.card,
                    { opacity: item.isRead ? 0.8 : 1 }
                  ]}>
                    <View style={styles.cardContent}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                          {item.title}
                        </Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.date}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Notification Detail Modal */}
        <Modal visible={!!selectedNotification} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalInnerContent}>
                  <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
                  <Text style={styles.modalDate}>
                    {selectedNotification && formatDate(selectedNotification.createdAt)}
                  </Text>
                  <Text style={styles.modalBody}>{selectedNotification?.message}</Text>
                </View>
              </ScrollView>
              <TouchableOpacity onPress={() => setSelectedNotification(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Toast />
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
    marginBottom: 10,
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
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 30,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "black",
  },
  searchIcon: {
    marginLeft: 10,
  },
  clearIcon: {
    marginLeft: 10,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: "5%",
    paddingVertical: "5%",
    position: "relative",
    bottom: 0,
  },  
  card: {
    backgroundColor: "#43546A",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '100%',
  },
  cardContent: {
    flex: 1,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 5,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    flex: 1,
    marginRight: 10,
    flexWrap: 'wrap',
    width: '90%',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginLeft: 5,
    marginTop: 5,
  },
  date: {
    fontSize: 14,
    color: "#B8C4D1",
    marginTop: 5,
  },
  loadingText: {
    fontSize: 16,
    color: "#B8C4D1",
    textAlign: "center",
    marginTop: 20,
  },
  noResultText: {
    fontSize: 16,
    color: "#B8C4D1",
    textAlign: "center",
    marginTop: 20,
  },
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
  modalDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
    textAlign: "left",
    width: '100%',
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
  },
  noNotificationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noNotificationsText: {
    fontSize: 18,
    color: "#B8C4D1",
    marginTop: 20,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1D72F3',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Notification;
