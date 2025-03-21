import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, Modal, TextInput, Button } from "react-native";

// Sample schedule data
const initialSchedule = {
  "2025-02-17": [
    { time: "07:00 - 09:00", subject: "Introduce to Aviation - P101" },
  ],
  "2025-02-19": [
    { time: "07:00 - 09:00", subject: "Introduce to Aviation - P101" },
    { time: "09:00 - 11:00", subject: "Flight Operations and Air Traffic Control - P301" },
  ],
  "2025-02-20": [
    { time: "13:00 - 15:00", subject: "Navigation and Meteorology - P305" },
  ],
  "2025-02-21": [
    { time: "07:00 - 09:00", subject: "Introduce to Aviation - P101" },
  ],
  "2025-02-22": [
    { time: "09:00 - 11:00", subject: "Flight Operations and Air Traffic Control - P301" },
  ],
};

export default function Schedule() {
  const { height } = Dimensions.get("window");

  const getCurrentWeek = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    return firstDayOfWeek;
  };

  const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control the modal visibility
  const [selectedDate, setSelectedDate] = useState(""); // State to store the selected date
  const [selectedTime, setSelectedTime] = useState(""); // State to store the selected time

  const changeWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  const getWeekDates = () => {
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeek);
      date.setDate(date.getDate() + i);
      const formattedDate = date.toISOString().split("T")[0];
      weekDates.push({ date: formattedDate, day: date.toLocaleDateString("en-US", { weekday: "long" }) });
    }
    return weekDates;
  };

  const handleSelectTime = () => {
    setIsModalVisible(false);
    // Add logic to navigate to the selected date/time
    // You can scroll to the specific date/time or highlight it
    console.log(`Navigating to: ${selectedDate} at ${selectedTime}`);
  };

  return (
    <ImageBackground
      source={require("../../../assets/Background-homepage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => changeWeek(-1)}>
              <Text style={styles.navButton}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.headerText}>Week of {currentWeek.toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => changeWeek(1)}>
              <Text style={styles.navButton}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Button to open the time picker modal */}
          <TouchableOpacity style={styles.timePickerButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.timePickerButtonText}>Go to Specific Time</Text>
          </TouchableOpacity>

          {/* Time Picker Modal */}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Date and Time</Text>

                {/* Date input */}
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#888"
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                />

                {/* Time input */}
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor="#888"
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                />

                {/* Select Button */}
                <TouchableOpacity style={styles.modalButton} onPress={handleSelectTime}>
                  <Text style={styles.modalButtonText}>Select</Text>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity style={styles.modalButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {getWeekDates().map(({ date, day }) => (
            <View key={date} style={styles.dayContainer}>
              <Text style={styles.dayTitle}>{day} - {date}</Text>
              {initialSchedule[date] ? (
                initialSchedule[date].map((item, index) => (
                  <Text key={index} style={styles.classText}>{item.time} - {item.subject}</Text>
                ))
              ) : (
                <Text style={styles.noClassText}>No classes</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20, // To avoid the content being hidden behind the footer
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  navButton: {
    fontSize: 24,
    color: "#fff",
    padding: 10,
    backgroundColor: "#333",
    borderRadius: 50,
  },
  timePickerButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: "center",
  },
  timePickerButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  dayContainer: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 8,
    elevation: 3, // Add some shadow for a more elevated look
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  classText: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
  },
  noClassText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});

