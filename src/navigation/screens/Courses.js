import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { getTrainingPlanUser, getSpecialty, getCourse } from '../../services/api';

const Courses = ({ navigation }) => {
  const { width, height } = useWindowDimensions();

  const certificates = [
    {
      id: "1",
      title: "Pilot Course Initial",
      status: "Completed",
      date: "14/10/2024",
      icon: "check-circle",
      iconColor: "green",
      instructor: "John Doe",
      type: "Beginner",
      description: "This is a description of the Pilot Course Initial.",
      subjects: ["Subject 1", "Subject 2", "Subject 3"],
    },
    {
      id: "2",
      title: "Pilot Course Recurrent",
      status: "In Progress",
      date: "",
      icon: "play-circle",
      iconColor: "white",
      instructor: "Jane Smith",
      type: "Advanced",
      description: "This is a description of the Pilot Course Recurrent.",
      subjects: ["Subject A", "Subject B", "Subject C"],
    },
  ];

  return (
    <ImageBackground
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Courses</Text>
        </View>

        {/* List of courses */}
        <View style={[styles.listContainer, { width, height: height * 0.8 }]}>
          <FlatList
            data={certificates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("CourseDetail", { course: item });
                }}
              >
                <View style={styles.card}>
                  <View style={styles.cardContent}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.date}>
                      {item.status === "Completed"
                        ? `Completed at ${item.date}`
                        : "In Progress"}
                    </Text>
                  </View>
                  <FontAwesome
                    name={item.icon}
                    size={30}
                    color={item.iconColor}
                    style={styles.icon}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
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
  date: {
    fontSize: 14,
    color: "#B8C4D1",
  },
  icon: {
    marginLeft: 10,
  },
});

export default Courses;
