import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  useWindowDimensions
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

const CourseDetail = ({ navigation }) => {
  const route = useRoute();
  const { course } = route.params; // Access course data passed from Courses.js
  const { width, height } = useWindowDimensions();

  return (
    <ImageBackground
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Detail</Text>
        </View>

        {/* Main content */}
        <ScrollView contentContainerStyle={[styles.contentContainer, { width, height: height * 0.8 }]}>
          <View style={styles.card}>
            <Text style={styles.title}>{course.title}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Instructor:</Text>
              <Text style={styles.info}>{course.instructor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Course Type:</Text>
              <Text style={styles.info}>{course.type}</Text>
            </View>

            <View style={styles.separator} />

            <Text style={styles.descriptionHeader}>Description:</Text>
            <Text style={styles.description}>{course.description}</Text>

            <Text style={styles.subjectHeader}>Course’s subjects:</Text>
            {course.subjects.map((subject, index) => (
              <TouchableOpacity key={index} style={styles.subjectContainer}>
                <FontAwesome name="book" size={18} color="#1E90FF" />
                <Text style={styles.subject}>{subject}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
    padding: 15,
    backgroundColor: "#43546A",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginLeft: 15,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  card: {
    marginTop: 10,
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  info: {
    fontSize: 16,
    color: "#333",
  },
  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  subjectHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subjectContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  subject: {
    fontSize: 16,
    color: "#1E90FF",
    marginLeft: 8,
  },
});

export default CourseDetail;
