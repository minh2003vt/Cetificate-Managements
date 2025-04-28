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
  ToastAndroid,
  StatusBar,
  Platform,
  PermissionsAndroid
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { WebView } from 'react-native-webview';
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Hàm tính chiều cao của status bar
const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
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
  
  // Tạo HTML để hiển thị PDF
  const generateHtmlContent = () => {
    if (!certificateData) return '';
    
    // CHỈ sử dụng certificateURLwithSas vì URL thông thường không thể truy cập file trong Azure Blob
    const sasUrl = certificateData.certificateURLwithSas;
    
    if (!sasUrl) {
      console.error("[Certificate] SAS URL không tồn tại, không thể hiển thị chứng chỉ");
      return '';
    }
    
    // In toàn bộ URL để kiểm tra
    console.log("[Certificate] URL đầy đủ (KHÔNG ENCODE):", sasUrl);
    
    // ⚠️ QUAN TRỌNG: KHÔNG encode URL - sử dụng chính xác URL từ API
    // SAS URL đã được cấu trúc đúng từ server, việc encode có thể thay đổi cấu trúc token
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            background-color: #f5f5f5;
          }
          .pdf-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
          .error-message {
            color: red;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <iframe 
            src="${sasUrl}" 
            type="application/pdf" 
            width="100%" 
            height="100%"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>
      </body>
      </html>
    `;
  };
  
  // Lấy HTML content
  const htmlContent = generateHtmlContent();
  
  // Thêm hàm fetchCertificateUrl để lấy SAS URL
  const fetchCertificateUrl = async () => {
    try {
      // Trong trường hợp này, certificateData đã chứa SAS URL
      // Logic fetch có thể được thêm vào đây nếu cần
      if (!certificateData || !certificateData.certificateURLwithSas) {
        console.error('Error: No SAS URL');
        setError('Unable to load certificate. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching SAS URL:', err);
      setError('Unable to load certificate. Please try again.');
    }
  };

  // Gọi fetchCertificateUrl khi component mount
  useEffect(() => {
    fetchCertificateUrl();
  }, [certificateData]);

  // Log để debug
  useEffect(() => {
    console.log("[Certificate] Rendering with data:", JSON.stringify(certificateData, null, 2));
    
    if (certificateData) {
      console.log("[Certificate] Has certificate URL:", !!certificateData.certificateURL);
      console.log("[Certificate] Has SAS URL:", !!certificateData.certificateURLwithSas);
      
      // Kiểm tra SAS URL có tồn tại không 
      const sasUrl = certificateData.certificateURLwithSas;
      
      if (!sasUrl) {
        console.error("[Certificate] SAS URL not available - cannot display certificate from Azure Blob Storage!");
        setError("SAS URL not available. Cannot display certificate from Azure Blob Storage. Please contact administrator.");
        return;
      }
      
      try {
        const urlObj = new URL(sasUrl);
        console.log("[Certificate] SAS URL is valid:", urlObj.href.substring(0, 100) + "...");
        
        // Kiểm tra xem URL có phải là Azure Blob Storage URL với SAS token
        if (urlObj.href.includes("blob.core.windows.net") && urlObj.search.includes("sig=")) {
          console.log("[Certificate] URL is valid Azure Blob Storage URL with SAS token");
        } else {
          console.warn("[Certificate] URL may not be a valid Azure Blob Storage URL with SAS token");
        }
      } catch (err) {
        console.error("[Certificate] Invalid URL format:", err.message);
        console.dir(err);
        setError(`Invalid URL format: ${err.message}`);
      }
    } else {
      console.error("[Certificate] certificateData is null or undefined");
    }
  }, [certificateData]);

  // Hàm format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  };

  // Phương thức tải xuống đơn giản bằng trình duyệt
  const downloadCertificateFile = async () => {
    try {
      console.log("[Certificate] Starting certificate download");
      
      if (!certificateData || !certificateData.certificateURLwithSas) {
        Alert.alert("Notice", "Unable to download. Certificate URL not available.");
        return;
      }

      // Lấy URL tải xuống
      const downloadUrl = certificateData.certificateURLwithSas;
      
      // Kiểm tra có thể mở URL không
      const canOpen = await Linking.canOpenURL(downloadUrl);
      
      if (canOpen) {
        // Mở URL trong trình duyệt
        await Linking.openURL(downloadUrl);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show("Opening browser for download...", ToastAndroid.SHORT);
        }
        
        console.log("[Certificate] Browser opened for download");
      } else {
        console.error("[Certificate] Cannot open URL:", downloadUrl);
        Alert.alert("Error", "Cannot open URL in browser.");
      }
    } catch (error) {
      console.error("[Certificate] Error during download:", error);
      Alert.alert("Error", "Cannot download certificate. Please try again later.");
    }
  };

  // Xử lý nhấn đôi
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Thay vì mở modal, mở URL trực tiếp trong trình duyệt
      openDirectUrl();
    }
    
    lastTapRef.current = now;
  };

  // Xử lý click
  const handleSingleTap = () => {
    // Nếu phát hiện single tap, hiển thị modal zoom
    setIsZoomed(true);
  };

  // Xử lý lỗi WebView
  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[Certificate] WebView error occurred at:', new Date().toISOString());
    console.error('[Certificate] Error code:', nativeEvent.code);
    console.error('[Certificate] Error description:', nativeEvent.description);
    console.error('[Certificate] Error URL:', nativeEvent.url);
    
    // Ghi log chi tiết hơn về lỗi
    console.dir(nativeEvent);
    
    // Thông báo lỗi cụ thể hơn
    let errorMessage = `Lỗi tải chứng chỉ (${nativeEvent.code}): ${nativeEvent.description}`;
    
    if (nativeEvent.code === -1009) {
      errorMessage = "Cannot connect to internet. Please check your connection and try again.";
    } else if (nativeEvent.code === -1001) {
      errorMessage = "Page loading timeout. Please try again later.";
    } else if (nativeEvent.code === 404) {
      errorMessage = "Certificate document not found. Please contact administrator.";
    } else if (nativeEvent.code === 403) {
      errorMessage = "You do not have permission to access this document. The certificate link may have expired.";
    }
    
    setError(errorMessage);
    setLoading(false);
  };

  // Xử lý lỗi HTTP
  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    
    if (nativeEvent.statusCode) {
      console.error(`[Certificate] HTTP Status Error: ${nativeEvent.statusCode}`);
      
      if (loadAttempts < 3) {
        console.log(`[Certificate] Retrying load (Attempt ${loadAttempts + 1} of 3)...`);
        setLoadAttempts(prev => prev + 1);
        setTimeout(() => {
          webViewRef.current?.reload();
        }, 1000); // Thử lại sau 1 giây
      } else {
        setLoading(false);
        setError('Unable to display certificate. Please try again.');
        
        // Hiển thị mã lỗi HTTP
        if (nativeEvent.statusCode) {
          setError(`HTTP Error: ${nativeEvent.statusCode}`);
        }
      }
    }
  };
  
  // Xử lý tin nhắn từ WebView
  const handleWebViewMessage = (event) => {
    try {
      console.log("[Certificate] Received raw message from WebView:", event.nativeEvent.data);
      const data = JSON.parse(event.nativeEvent.data);
      console.log("[Certificate] Parsed message from WebView:", data);
      
      if (data.type === 'error') {
        setError(data.message);
        setLoading(false);
      } else if (data.type === 'loaded' || data.type === 'success') {
        setLoading(false);
      }
    } catch (err) {
      console.error("[Certificate] Error parsing WebView message:", err);
    }
  };
  
  // Thử lại tải chứng chỉ
  const handleRetryLoad = () => {
    setError(null);
    setLoading(true);
    setLoadAttempts(prev => prev + 1);
  };

  // Thêm hàm mở PDF trực tiếp trong trình duyệt
  const openInBrowser = async () => {
    try {
      if (!certificateData || !certificateData.certificateURLwithSas) {
        console.error("[Certificate] URL not available for browser opening");
        Alert.alert("Error", "Cannot open in browser. Please try again later.");
        return;
      }
      await Linking.openURL(certificateData.certificateURLwithSas);
    } catch (error) {
      console.error("[Certificate] Error opening in browser:", error);
      Alert.alert("Error", "Cannot open in browser. Please try again later.");
    }
  };

  // Thêm hàm để mở URL trực tiếp
  const openDirectUrl = async () => {
    try {
      if (!certificateData || !certificateData.certificateURLwithSas) {
        Alert.alert("Error", "Certificate URL not found");
        return;
      }
      await Linking.openURL(certificateData.certificateURLwithSas);
    } catch (error) {
      console.error('[Certificate] Error opening direct URL:', error);
      Alert.alert("Error", "Cannot open URL directly. Please try again later.");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading certificate...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.exportButton, { marginTop: 20 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exportText}>Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Kiểm tra chứng chỉ và SAS URL có sẵn không
    if (certificateData && certificateData.certificateURLwithSas) {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.certificateImageContainer}>
            {/* Sử dụng WebView trực tiếp với URL SAS thay vì HTML */}
            <WebView
              ref={webViewRef}
              key={`pdf-viewer-${loadAttempts}`}
              source={{ uri: certificateData.certificateURLwithSas }}
              style={styles.certificateWebView}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              )}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onError={handleWebViewError}
              onHttpError={handleHttpError}
              onLoadStart={(e) => {
                console.log("[Certificate] WebView starting to load:", e.nativeEvent.url);
                setLoading(true);
              }}
              onLoadEnd={(e) => {
                console.log("[Certificate] WebView finished loading:", e.nativeEvent.url);
                setLoading(false);
              }}
              originWhitelist={['*']}
              mixedContentMode="always"
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              allowingReadAccessToURL="*"
              cacheEnabled={false}
              incognito={true}
            />
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#1D72F3' }]} // Màu xanh dương
              onPress={downloadCertificateFile} // Sử dụng phương thức mới
            >
              <Ionicons name="download-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Export</Text>
            </TouchableOpacity>

          </View>
          
          {/* Thêm nút thử lại */}
          {loading && (
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: "#FF6B6B", marginTop: 10 }]}
              onPress={handleRetryLoad}
            >
              <FontAwesome name="refresh" size={20} color="#fff" />
              <Text style={styles.exportText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // Nếu không có SAS URL, hiển thị thông báo lỗi
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Không thể hiển thị chứng chỉ! SAS URL không có sẵn.
        </Text>
        {certificateData && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Certificate ID: {certificateData.certificateId || "N/A"}
            </Text>
            <Text style={styles.debugText}>
              URL có sẵn: {certificateData.certificateURL ? "Có" : "Không"}
            </Text>
            <Text style={styles.debugText}>
              SAS URL có sẵn: {certificateData.certificateURLwithSas ? "Có" : "Không"}
            </Text>
            <Text style={[styles.debugText, {color: '#FF6B6B', fontWeight: 'bold'}]}>
              Cần SAS URL để truy cập tệp PDF từ Azure Blob Storage.
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
          <Text style={styles.exportText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || 'Chứng chỉ'}</Text>
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
                setLoadAttempts(loadAttempts + 1);
                fetchCertificateUrl();
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : certificateData ? (
          <>
            <View 
              style={[
                styles.webviewContainer, 
                isZoomed && styles.zoomedWebviewContainer
              ]}
              onTouchStart={(e) => handleDoubleTap(e)}
            >
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webview}
                javaScriptEnabled={true}
                onLoad={() => setLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView error:', nativeEvent);
                  setError('Không thể hiển thị chứng chỉ. Vui lòng thử lại.');
                  setLoading(false);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView HTTP error:', nativeEvent);
                  setError(`Lỗi HTTP: ${nativeEvent.statusCode}`);
                  setLoading(false);
                }}
                key={loadAttempts} // Khi loadAttempts thay đổi, WebView sẽ được tạo lại
              />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#1D72F3" />
                  <Text style={styles.loadingText}>Loading certificate...</Text>
                </View>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#1D72F3' }]} // Màu xanh dương
                onPress={downloadCertificateFile} // Sử dụng phương thức mới
              >
                <Ionicons name="download-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Export</Text>
              </TouchableOpacity>

            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1D72F3" />
            <Text style={styles.loadingText}>loading certificate...</Text>
          </View>
        )}
      </View>

      <Modal
        visible={isZoomed}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsZoomed(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsZoomed(false)}
          >
            <FontAwesome name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <WebView
            key={`pdf-viewer-fullscreen-${loadAttempts}`}
            source={{ uri: certificateData?.certificateURLwithSas || '' }}
            style={styles.fullScreenWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#0000ff" />
              </View>
            )}
            startInLoadingState={true}
            onError={handleWebViewError}
            onHttpError={handleHttpError}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            allowingReadAccessToURL="*"
            cacheEnabled={false}
            incognito={true}
          />
          
          <TouchableOpacity
            style={styles.fullscreenActionButton}
            onPress={openDirectUrl}
          >
            <FontAwesome name="external-link" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Mở trong trình duyệt</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  subTitle: {
    fontSize: 16,
    color: "white",
    marginBottom: 20,
  },
  contentContainer: {
    marginTop: 20,
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
  },
  certificateWebView: {
    width: "100%",
    height: "100%",
  },
  doubleTapHint: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    padding: 5,
    borderRadius: 5,
    fontSize: 12,
  },
  webViewLoading: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1D72F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  exportText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenWebView: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  closeButton: {
    position: "absolute",
    top: getStatusBarHeight() + 10,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#0000ff",
  },
  debugInfo: {
    marginTop: 10,
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    width: "90%",
  },
  debugText: {
    marginBottom: 5,
    fontSize: 14,
    color: "#333",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenActionButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  retryButton: {
    backgroundColor: '#1D72F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  webviewContainer: {
    flex: 1,
    width: "100%",
    height: Dimensions.get("window").height * 0.6,
    marginVertical: 20,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  zoomedWebviewContainer: {
    elevation: 10,
  },
  webview: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
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
});

export default Certificate;
