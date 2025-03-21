import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from "react-native";
import { useRoute } from "@react-navigation/native";

const Certificate = () => {
  const route = useRoute();
  const { title, date, status } = route.params || {}; // Lấy dữ liệu từ navigation params

  return (
    <ImageBackground
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
      
        <Text style={styles.headerTitle}>Certificate</Text>
        <Text style={styles.subTitle}>{title}</Text>

        <View style={styles.certificateContainer}>
          <View style={styles.certCont}>
          <Text style={styles.company}>Vietjet Air</Text>
          <Text style={styles.certTitle}>Certificate of Training</Text>
          <Text style={styles.subText}>Head of training</Text>

          {/* Ảnh đại diện */}
          <View style={styles.row}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.details}>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Date of birth:</Text> 01/01/1995
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Certification number:</Text> PPL-123456
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Date issue:</Text> {date || "N/A"}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Training time frame:</Text> 50 hours
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Complete score:</Text> 8.5
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.bold}>Academic ranking:</Text> A
              </Text>
            </View>
          </View>

          <Text style={styles.signature}>Digital signature</Text>
          </View>

          {/* Nút Export */}
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportText}>EXPORT</Text>
          </TouchableOpacity>

        </View>
      </View>
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
  certCont:{
    marginTop:40,
    width:"90%",
    backgroundColor:"lightgrey",
    opacity:"80%",
    alignItems:"center",
    padding:"6%",
    borderRadius:"5%"
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 16,
    color: "white",
    marginBottom: 20,
  },
  certificateContainer: {
    backgroundColor: "white",
    flex: 1,
    width: "100%",
    paddingHorizontal: "10%",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    alignItems: "center",
    elevation: 5,
  },
  company: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  subText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "gray",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  details: {
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
  },
  bold: {
    fontWeight: "bold",
  },
  signature: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
    marginTop: 15,
  },
  exportButton: {
    marginTop: 20,
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  exportText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Certificate;
