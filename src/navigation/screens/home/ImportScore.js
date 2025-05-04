import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ImageBackground, SafeAreaView, ActivityIndicator,
  useWindowDimensions, Platform, ScrollView
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_HOMEPAGE } from '../../../utils/assets';
import { uploadGradeExcel } from '../../../services/api';
import { Table, Row, Rows } from 'react-native-table-component';
import * as XLSX from 'xlsx';

const ImportScore = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingError, setParsingError] = useState(null);

  // Đọc dữ liệu từ file Excel thực
  const readExcelFile = async (fileUri) => {
    try {
      setParsingError(null);      
      // Đọc file dưới dạng base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      // Parse dữ liệu với XLSX
      const workbook = XLSX.read(base64Data, { type: 'base64' });
      
      // Lấy sheet đầu tiên
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Chuyển đổi sang dạng JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
      // Kiểm tra dữ liệu trống
      if (!jsonData || jsonData.length === 0) {
        setParsingError("File Excel không có dữ liệu");
        return null;
      }
      
      // Lấy header và rows
      const headers = jsonData[0];
      const rows = jsonData.slice(1).filter(row => row.length > 0); // Lọc bỏ hàng trống
      
      return {
        headers: headers,
        rows: rows
      };
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      setParsingError(`Không thể đọc tệp Excel: ${error.message}`);
      return null;
    }
  }

  // Chọn file Excel từ thiết bị
  const pickExcelFile = async () => {
    try {
      setError(null);
      setParsingError(null);
      
      // Sử dụng cách mới nhất để chọn tệp
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
        multiple: false
      });


      if (result.canceled) {
        console.log('User cancelled document picker');
        return;
      }

      // Kiểm tra xem có asset được chọn không
      if (result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        const fileUri = selectedFile.uri;
        const fileName = selectedFile.name;
        
        // Kiểm tra đuôi file
        if (!fileName.toLowerCase().endsWith('.xls') && !fileName.toLowerCase().endsWith('.xlsx')) {
          Alert.alert('Lỗi', 'Vui lòng chọn file Excel (đuôi .xls hoặc .xlsx)');
          return;
        }

        
        // Kiểm tra kích thước file
        try {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          
          if (fileInfo.size > 10 * 1024 * 1024) { // Giới hạn 10MB
            Alert.alert('Lỗi', 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
            return;
          }
        } catch (fileError) {
          console.error('Error checking file size:', fileError);
        }
        
        setExcelFile({
          uri: fileUri,
          name: fileName,
          type: selectedFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        // Đọc dữ liệu từ file Excel thực
        setLoading(true);
        const excelData = await readExcelFile(fileUri);
        setLoading(false);
        
        if (excelData) {
          setPreviewData(excelData);
        } else {
          // Nếu có lỗi khi đọc file, vẫn giữ file đã chọn
          console.log("Could not read Excel data, but keeping file reference");
        }
        
      } else {
        Alert.alert('Error', 'Cannot pick file. Please try again later.');
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Cannot pick file. Please try again later. Error: ' + err.message);
      setLoading(false);
    }
  };

  // Gửi file Excel lên server
  const sendExcelFile = async () => {
    if (!excelFile) {
      Alert.alert('Error', 'Please select an Excel file before sending');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      // Hiển thị tiến trình tải lên
      const uploadTimer = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      // Gọi API để upload file
      const response = await uploadGradeExcel(excelFile.uri, token);
      
      clearInterval(uploadTimer);
      setUploadProgress(100);
            
      // Hiển thị thông báo thành công
      Alert.alert(
        'Success',
        'File has been uploaded successfully.',
        [{ text: 'OK', onPress: () => {
          setExcelFile(null);
          setPreviewData(null);
        }}]
      );
    } catch (err) {
      console.error('Error uploading file:', err);
      let errorMessage = 'An error occurred while uploading the file. Please try again later.';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.errors && err.errors.file) {
        // Xử lý lỗi cụ thể từ API
        errorMessage = err.errors.file[0] || errorMessage;
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={BACKGROUND_HOMEPAGE}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Score</Text>
          <View style={styles.rightHeaderSpace} />
        </View>

        {/* Main content */}
        <View style={[styles.mainContainer, { width, height: height * 0.8 }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1D72F3" />
              <Text style={styles.loadingText}>
                {uploadProgress > 0 ? `Đang tải lên... ${uploadProgress}%` : 'Đang xử lý...'}
              </Text>
              {uploadProgress > 0 && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                </View>
              )}
            </View>
          ) : (
            <ScrollView style={styles.contentContainer}>
              {/* File Preview Area */}
              <View style={styles.fileDisplayArea}>
                {excelFile ? (
                  <View style={styles.selectedFileContainer}>
                    <FontAwesome name="file-excel-o" size={40} color="#217346" style={styles.fileIcon} />
                    <Text style={styles.selectedFileName}>{excelFile.name}</Text>
                    
                    {parsingError && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{parsingError}</Text>
                      </View>
                    )}
                    
                    {/* Excel data preview */}
                    {previewData && (
                      <ScrollView horizontal style={styles.excelPreviewScroll}>
                        <View style={styles.excelPreviewContainer}>
                          {/* Excel column headers */}
                          <View style={styles.excelHeaderRow}>
                            <View style={styles.excelIndexCell}>
                              <Text style={styles.excelHeaderText}>#</Text>
                            </View>
                            {previewData.headers.map((header, index) => (
                              <View key={`header-${index}`} style={styles.excelHeaderCell}>
                                <Text style={styles.excelHeaderText}>{header}</Text>
                              </View>
                            ))}
                          </View>
                          
                          {/* Excel rows */}
                          {previewData.rows.map((row, rowIndex) => (
                            <View key={`row-${rowIndex}`} style={styles.excelRow}>
                              <View style={styles.excelIndexCell}>
                                <Text style={styles.excelIndexText}>{rowIndex + 1}</Text>
                              </View>
                              {row.map((cell, cellIndex) => (
                                <View key={`cell-${rowIndex}-${cellIndex}`} style={styles.excelCell}>
                                  <Text style={styles.excelCellText}>{cell}</Text>
                                </View>
                              ))}
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    )}
                  </View>
                ) : (
                  <View style={styles.noFileContainer}>
                    <FontAwesome name="file-excel-o" size={50} color="#999" />
                    <Text style={styles.noFileText}>No file selected</Text>
                    {error && (
                      <Text style={styles.uploadError}>An error occurred while uploading the file. Please try again later.</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.importButton}
                  onPress={pickExcelFile}
                >
                  <Text style={styles.importButtonText}>Import</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendButton, !excelFile && styles.sendButtonDisabled]}
                  onPress={sendExcelFile}
                  disabled={!excelFile}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    position: 'relative',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  rightHeaderSpace: {
    width: 30, // Tương đương với kích thước của nút back để cân bằng header
  },
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: '5%',
    paddingVertical: '5%',
    position: 'absolute',
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
  },
  fileDisplayArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9F9F9',
    minHeight: 200,
  },
  noFileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noFileText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  uploadError: {
    marginTop: 15,
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedFileContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fileIcon: {
    marginBottom: 10,
  },
  selectedFileName: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  excelPreviewScroll: {
    width: '100%',
    marginTop: 10,
  },
  excelPreviewContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  excelHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  excelHeaderCell: {
    width: 130,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    backgroundColor: '#fff',
  },
  excelIndexCell: {
    width: 40,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  excelHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  excelRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  excelCell: {
    width: 130,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    backgroundColor: '#fff',
  },
  excelIndexText: {
    fontSize: 12,
    textAlign: 'center',
  },
  excelCellText: {
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  importButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  importButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#1D72F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#B8C4D1',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1D72F3',
    marginBottom: 15,
  },
  progressBarContainer: {
    width: '80%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1D72F3',
  },
  errorContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#FFEEEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
  },
});

export default ImportScore; 