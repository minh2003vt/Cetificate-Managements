import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ImageBackground,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  PermissionsAndroid
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { WebView } from 'react-native-webview';
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

// Hàm tính chiều cao của status bar
const getStatusBarHeight = () => {
  return Platform.select({
    ios: 44,
    android: StatusBar.currentHeight || 0
  });
};

const Certificate = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { certificateData, title } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);
  const lastTapRef = useRef(0);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [internetPermission, setInternetPermission] = useState(Platform.OS !== 'android');
  const [viewerReady, setViewerReady] = useState(false);
  
  // Kiểm tra quyền Internet - chỉ dùng khi cần kiểm tra permissions
  useEffect(() => {
    const checkInternetPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          // Internet permission is typically granted by default, so we don't actually need to request it
          setInternetPermission(true);
        } catch (err) {
          console.error("Error checking internet permission:", err);
        }
      }
    };
    
    checkInternetPermission();
  }, []);
  
  // Kiểm tra dữ liệu certificate
  useEffect(() => {
    if (!certificateData) {
      console.error("[Certificate] Certificate data is null or undefined");
      setError("Certificate data not available");
      setLoading(false);
      return;
    }
    
    // Kiểm tra SAS URL ngay từ đầu để tránh lỗi
    if (!certificateData.certificateURLwithSas) {
      console.error("[Certificate] SAS URL not available");
      setError("Certificate URL not available. Please contact administrator.");
      setLoading(false);
      return;
    }
    
    setViewerReady(true);
  }, [certificateData]);
  
  // Thêm function để mở trực tiếp trong trình duyệt - cách an toàn nhất
  const openInBrowser = async () => {
    try {
      if (!certificateData || !certificateData.certificateURLwithSas) {
        Alert.alert("Error", "Certificate URL not available");
        return;
      }
      
      // Kiểm tra có thể mở URL không
      const canOpen = await Linking.canOpenURL(certificateData.certificateURLwithSas);
        
      if (canOpen) {
        await Linking.openURL(certificateData.certificateURLwithSas);
        showToast("Opening certificate in browser");
        } else {
        console.error("[Certificate] Cannot open URL:", certificateData.certificateURLwithSas);
        Alert.alert("Error", "Cannot open URL in browser.");
      }
    } catch (error) {
      console.error("[Certificate] Error opening in browser:", error);
      Alert.alert("Error", "Cannot open in browser. Please try again later.");
    }
  };
  
  // Đơn giản hóa việc hiển thị toast
  const showToast = (message) => {
    Toast.show({
      type: 'info',
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
      autoHide: true,
    });
  };

  // Phương thức tải xuống đơn giản bằng trình duyệt
  const downloadCertificateFile = async () => {
    try {      
      if (!certificateData || !certificateData.certificateURLwithSas) {
        Alert.alert("Notice", "Unable to download. Certificate URL not available.");
        return;
      }

      // Mở URL trong trình duyệt để tải xuống
      await openInBrowser();
      
    } catch (error) {
      console.error("[Certificate] Error during download:", error);
      Alert.alert("Error", "Cannot download certificate. Please try again later.");
    }
  };

  // Xử lý hiển thị PDF trên Android an toàn hơn
  const renderPdfViewer = () => {
    if (!viewerReady || !certificateData?.certificateURLwithSas) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D72F3" />
          <Text style={styles.loadingText}>Preparing certificate viewer...</Text>
        </View>
      );
    }

    // Sử dụng Google PDF Viewer cho Android - cách an toàn nhất
    const pdfSource = Platform.OS === 'android'
      ? { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(certificateData.certificateURLwithSas)}` }
      : { uri: certificateData.certificateURLwithSas };
      
      return (
            <WebView
              ref={webViewRef}
              key={`pdf-viewer-${loadAttempts}`}
        source={pdfSource}
              style={styles.certificateWebView}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color="#1D72F3" />
                </View>
              )}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
        onError={(e) => {
          console.error("[Certificate] WebView error:", e.nativeEvent);
          setError("Cannot display certificate. Try opening in browser.");
          setLoading(false);
        }}
        onHttpError={(e) => {
          console.error("[Certificate] HTTP error:", e.nativeEvent);
          setError(`Cannot load certificate (HTTP Error ${e.nativeEvent.statusCode})`);
                setLoading(false);
              }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
              originWhitelist={['*']}
              mixedContentMode="always"
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
        cacheEnabled={true}
        onShouldStartLoadWithRequest={() => true}
      />
    );
  };

  // Trả về giao diện chính
  return (
    <ImageBackground
      source={BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || 'Certificate'}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setError(null);
                setLoading(true);
                setLoadAttempts(prev => prev + 1);
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: "#28a745", marginTop: 10 }]}
              onPress={openInBrowser}
            >
              <Text style={styles.retryButtonText}>Open in Browser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: "#6c757d", marginTop: 10 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.certificateImageContainer}>
              {renderPdfViewer()}
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#1D72F3" />
                  <Text style={styles.loadingText}>Loading certificate...</Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#1D72F3' }]}
                onPress={downloadCertificateFile}
              >
                <Ionicons name="download-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Export</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#28a745', marginLeft: 10 }]}
                onPress={openInBrowser}
              >
                <FontAwesome name="external-link" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
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
    alignItems: "center",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  certificateImageContainer: {
    width: "100%",
    height: Dimensions.get("window").height * 0.6,
    marginVertical: 20,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 5,
    position: "relative",
    backgroundColor: "#f8f8f8",
  },
  certificateWebView: {
    width: "100%",
    height: "100%",
  },
  webViewLoading: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D72F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1D72F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    width: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default Certificate;
