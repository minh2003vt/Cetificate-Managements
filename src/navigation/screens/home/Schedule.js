import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    ImageBackground,
    useWindowDimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { getSchedule, getUserById } from '../../../services/api';
import { format, startOfWeek, addDays, isSameDay, parseISO, isWithinInterval, addMinutes, addHours } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKGROUND_HOMEPAGE, BACKGROUND_DARK } from '../../../utils/assets';
// Helper function to check if a date has events
const hasEvents = (dateKey, data) => {
    // Check if the key exists and the array is not empty
    return data && data[dateKey] && data[dateKey].length > 0;
};

const formatScheduleData = async (apiData, token) => {
    const formattedData = {};    
    let subjectsToProcess = [];
    
    if (!apiData || !Array.isArray(apiData)) {
        
        // Xử lý trường hợp API trả về cấu trúc có subschedule hoặc subscheldule (lỗi chính tả)
        if (apiData && typeof apiData === 'object') {
            // Kiểm tra trường hợp lỗi chính tả 'subscheldule'
            if (Array.isArray(apiData.subscheldule)) {
                subjectsToProcess = apiData.subscheldule;
            } 
            // Kiểm tra trường hợp đúng chính tả 'subschedule'
            else if (Array.isArray(apiData.subschedule)) {
                subjectsToProcess = apiData.subschedule;
            }
            else if (Array.isArray(apiData.subjects)) {
                subjectsToProcess = apiData.subjects;
            } else if (Array.isArray(apiData.data)) {
                subjectsToProcess = apiData.data;
            } else {
                return formattedData; 
            }
        } else {
            return formattedData;
        }
    } else {
        subjectsToProcess = apiData;
    }
    
    // Tạo một Set để theo dõi các sự kiện đã được xử lý
    const processedEvents = new Set();
    
    for (const subject of subjectsToProcess) {
        
        // Check if subject has schedules
        if (!subject.schedules || !Array.isArray(subject.schedules)) {
            continue;
        }
        
        
        for (const schedule of subject.schedules) {
            // Generate a fallback ID if scheduleId is missing
            const scheduleID = schedule.scheduleID || schedule.scheduleId;
            if (!scheduleID) {
                schedule.scheduleID = `fallback-${subject.subjectId}-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`;
            }
         
            // Get instructor information if instructorID is available
            let instructorName = 'N/A';
            if (schedule.instructorID) {
                try {
                    const instructor = await getUserById(schedule.instructorID, token);
                    instructorName = instructor.fullName || 'N/A';
                } catch (error) {
                    console.error('Error fetching instructor:', error);
                }
            }
            
            // Generate group class ID for display (e.g. MC1705)
            const groupClass = generateGroupClassId(subject.subjectId, scheduleID);
            
            // Handle recurring events based on daysOfWeek
            if (schedule.daysOfWeek) {
                const daysArray = schedule.daysOfWeek.split(',').map(day => day.trim());
                
                // Get the start and end date range for the schedule
                const scheduleStartDate = new Date(schedule.startDateTime);
                const scheduleEndDate = new Date(schedule.endDateTime);
                
                // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
                const dayMap = {
                    'Sunday': 0,
                    'Monday': 1,
                    'Tuesday': 2,
                    'Wednesday': 3,
                    'Thursday': 4,
                    'Friday': 5,
                    'Saturday': 6
                };
                
                // Parse the class time (HH:MM:SS)
                let classTime = schedule.classTime || '00:00:00';
                const [hours, minutes] = classTime.split(':').map(Number);
                
                // Parse the subject period (HH:MM:SS)
                let subjectPeriod = schedule.subjectPeriod || '01:30:00';
                const [periodHours, periodMinutes] = subjectPeriod.split(':').map(Number);
                
                // Generate events for each occurrence of the class
                // Start from the schedule start date and go until the end date
                let currentDate = new Date(scheduleStartDate);
                
                while (currentDate <= scheduleEndDate) {
                    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek);
                    
                    // If this day is in the daysOfWeek array, create an event
                    if (daysArray.includes(dayName)) {
                        // Create a date with the correct time
                        const eventDate = new Date(currentDate);
                        eventDate.setHours(hours, minutes, 0);
                        
                        // Calculate end time by adding the period
                        const endTime = new Date(eventDate);
                        endTime.setHours(endTime.getHours() + periodHours);
                        endTime.setMinutes(endTime.getMinutes() + periodMinutes);
                        
                        // Format date as key (YYYY-MM-DD)
                        const dateKey = format(eventDate, 'yyyy-MM-dd');                        
                        // Tạo một event signature để kiểm tra trùng lặp
                        const eventSignature = `${subject.subjectId}-${dateKey}-${format(eventDate, 'HH:mm')}`;
                        
                        // Chỉ thêm sự kiện nếu chưa tồn tại
                        if (!processedEvents.has(eventSignature)) {
                            processedEvents.add(eventSignature);
                            
                            // Create event object with a random color for visual distinction
                            const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                            const randomColor = colors[Math.floor(Math.random() * colors.length)];
                            
                            // Generate a unique ID for each event to prevent key conflicts
                            const uniqueEventId = `${scheduleID}-${dateKey}-${format(eventDate, 'HHmm')}-${Math.random().toString(36).substring(2, 6)}`;
                            
                            const event = {
                                id: uniqueEventId,
                                subjectId: subject.subjectId,
                                subjectName: subject.subjectName,
                                startTime: format(eventDate, 'HH:mm'),
                                endTime: format(endTime, 'HH:mm'),
                                startDateTime: eventDate,
                                endDateTime: endTime,
                                sessionNo: schedule.sessionNo || '7',
                                room: schedule.room || 'N/A',
                                location: schedule.location || 'School',
                                instructor: schedule.instructorName || 'N/A',
                                status: schedule.status || 'pending',
                                color: randomColor,
                                dayOfWeek: dayName,
                                groupClass: groupClass,
                            };
                            
                            // Add to formatted data
                            if (!formattedData[dateKey]) {
                                formattedData[dateKey] = [];
                            }
                            
                            formattedData[dateKey].push(event);
                        }  
                    }
                    
                    // Move to the next day
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } else {
                // Handle non-recurring events (single occurrence)
                // Parse dates
                const startDateTime = new Date(schedule.startDateTime);
                const endDateTime = schedule.endDateTime ? new Date(schedule.endDateTime) : new Date(startDateTime);
                
                // If there's no explicit end time but there's a subject period, calculate the end time
                if (schedule.subjectPeriod && startDateTime.getTime() === endDateTime.getTime()) {
                    const [periodHours, periodMinutes] = (schedule.subjectPeriod || '01:30:00').split(':').map(Number);
                    endDateTime.setHours(endDateTime.getHours() + periodHours);
                    endDateTime.setMinutes(endDateTime.getMinutes() + periodMinutes);
                }
                
                
                // Format date as key (YYYY-MM-DD)
                const dateKey = format(startDateTime, 'yyyy-MM-dd');
                
                // Tạo một event signature để kiểm tra trùng lặp
                const eventSignature = `${subject.subjectId}-${dateKey}-${format(startDateTime, 'HH:mm')}`;
                
                // Chỉ thêm sự kiện nếu chưa tồn tại
                if (!processedEvents.has(eventSignature)) {
                    processedEvents.add(eventSignature);
                    
                    // Create event object with a random color for visual distinction
                    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    
                    // Generate a unique ID for each event to prevent key conflicts
                    const uniqueEventId = `${scheduleID}-${dateKey}-${format(startDateTime, 'HHmm')}-${Math.random().toString(36).substring(2, 6)}`;
                    
                    const event = {
                        id: uniqueEventId,
                        subjectId: subject.subjectId,
                        subjectName: subject.subjectName,
                        startTime: format(startDateTime, 'HH:mm'),
                        endTime: format(endDateTime, 'HH:mm'),
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        sessionNo: schedule.sessionNo || '5',
                        room: schedule.room || 'N/A',
                        location: schedule.location || 'School',
                        instructor: instructorName,
                        status: schedule.status || 'pending',
                        color: randomColor,
                        groupClass: groupClass,
                    };
                
                    // Add to formatted data
                    if (!formattedData[dateKey]) {
                        formattedData[dateKey] = [];
                    }
                    
                    formattedData[dateKey].push(event);
                } else {
                    console.log(`Skipped duplicate event: ${eventSignature}`);
                }
            }
        }
    }
    
    return formattedData;
};

// Helper function to generate a class ID for display (e.g., MC1705)
const generateGroupClassId = (subjectId, scheduleId) => {
    // Take first 2 characters from subjectId
    const prefix = subjectId.substring(0, 2);
    // Generate a random 4 digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomNum}`;
};

const Schedule = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [scheduleData, setScheduleData] = useState({});
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const { width } = useWindowDimensions();

    // --- Calculate dimensions inside the component --- 
    const ROW_HEIGHT = 150;
    const DAY_CONTAINER_PADDING_HORIZONTAL = 0;
    const BORDER_WIDTH = 1;
    const TOTAL_INTER_DAY_BORDER_WIDTH = BORDER_WIDTH * 6; 
    const AVAILABLE_WIDTH_FOR_HEADERS = width - (DAY_CONTAINER_PADDING_HORIZONTAL * 2) - TOTAL_INTER_DAY_BORDER_WIDTH;
    const DAY_HEADER_WIDTH = AVAILABLE_WIDTH_FOR_HEADERS / 7;
    const DATE_COLUMN_WIDTH = 65;
    const ACTIVITY_COLUMN_WIDTH = width - DATE_COLUMN_WIDTH - BORDER_WIDTH;
    // --- End dimension calculations ---

    // Always start with the current week
    const initialDate = new Date();
    const [currentWeekStart, setCurrentWeekStart] = useState(
        startOfWeek(initialDate, { weekStartsOn: 1 })
    );
    
    const currentWeekDates = useMemo(() => {
        const start = currentWeekStart;
        const end = addDays(start, 6);
        return [start, addDays(start, 1), addDays(start, 2), addDays(start, 3), addDays(start, 4), addDays(start, 5), end];
    }, [currentWeekStart]);

    const currentWeekRangeStr = useMemo(() => {
        const end = addDays(currentWeekStart, 6);
        const startFormat = format(currentWeekStart, 'dd/MM');
        const endFormat = format(end, 'dd/MM/yyyy');
        return `${startFormat} - ${endFormat}`;
    }, [currentWeekStart]);

    const currentMonthYearStr = useMemo(() => {
        return format(currentWeekStart, 'MM/yyyy');
    }, [currentWeekStart]);

    const handlePreviousWeek = () => {
        setCurrentWeekStart((prev) => {
            const newWeekStart = addDays(prev, -7);
            return newWeekStart;
        });
    };

    const handleNextWeek = () => {
        setCurrentWeekStart((prev) => {
            const newWeekStart = addDays(prev, 7);
            return newWeekStart;
        });
    };
    
    // Fetch schedule data from API
    const fetchScheduleData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get token and role from AsyncStorage
            const userToken = await AsyncStorage.getItem('userToken');
            const userRole = await AsyncStorage.getItem('userRole');
            setToken(userToken);
            
            // Lưu userRole vào state để sử dụng trong UI
            setUserRole(userRole);
            
            if (!userToken) {
                throw new Error('No authentication token found');
            }
            
            const data = await getSchedule(userToken, userRole);
            
            // formatScheduleData sẽ tự động xác định và trích xuất dữ liệu đúng
            const formattedData = await formatScheduleData(data, userToken);
            setScheduleData(formattedData);
        } catch (error) {
            console.error('Error fetching schedule data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Find the first week with events
    const findWeekWithEvents = (data) => {
        if (!data || Object.keys(data).length === 0) return null;
        
        // Sort date keys chronologically
        const dateKeys = Object.keys(data).sort();
        if (dateKeys.length === 0) return null;
        const firstDate = new Date(dateKeys[0]);
        return firstDate;
    };
    
    // Initial data fetch
    useEffect(() => {
        const loadSchedule = async () => {
            await fetchScheduleData();
        };
        
        loadSchedule();
    }, []);
    

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const renderEventItem = (event, index) => {
        const isInstructor = userRole && userRole.toLowerCase() === 'instructor';
        
        return (
            <View key={`event-${event.id}-${index}`} style={styles.scheduleSlot}>
                {/* Time Column with Time */}
                <View style={styles.timeInfoColumn}>
                    <Text style={styles.timeText}>{event.startTime}</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeText}>{event.endTime}</Text>
                </View>
                
                {/* Event Details */}
                <View style={styles.eventDetailsContainer}>
                    <Text style={styles.subjectNameText} numberOfLines={1} ellipsizeMode="tail">
                        {event.subjectName}
                    </Text>
                    <View style={styles.eventInfoContainer}>
                        <Text style={styles.roomText}>
                            Room: {event.room} {event.location}
                        </Text>
                        <Text style={styles.subjectCodeText}>
                            ID: {event.subjectId}
                        </Text>
                    </View>
                    
                    {/* Chỉ hiển thị instructor nếu không phải là giảng viên */}
                    {!isInstructor && (
                        <Text style={styles.instructorText} numberOfLines={1}>
                            Instructor: {event.instructor}
                        </Text>
                    )}
                    
                    {/* Status Buttons - Only show present if status is present */}
                    {event.status === 'present' && (
                        <View style={styles.eventButtonsRow}>
                            <View style={styles.presentButton}>
                                <Text style={styles.buttonText}>present</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const styles = StyleSheet.create({
        background: {
            flex: 1,
            width: "100%",
        },
        containerSafe: {
            flex: 1,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginHorizontal: 20,
            marginVertical: 15,
        },
        headerTitle: {
            fontSize: 22,
            fontWeight: "bold",
            color: "white",
        },
        contentArea: {
            flex: 1,
            backgroundColor: "white",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: "85%",
        },
        // Week Navigation
        weekNavigationContainer: {
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
        },
        currentWeekText: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 10,
            textAlign: 'center',
            color: '#1D72F3',
        },
        weekNavigationControls: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        weekNavButton: {
            padding: 8,
        },
        weekNavButtonText: {
            fontSize: 18,
            color: '#1D72F3',
        },
        monthYearText: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#333',
        },
        // Day Headers
        dayHeadersContainer: {
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
            paddingVertical: 10,
        },
        dayHeaderColumn: {
            flex: 1,
            alignItems: 'center',
        },
        dayHeaderText: {
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: 5,
            color: '#555',
        },
        dayNumberCircle: {
            width: 26,
            height: 26,
            borderRadius: 13,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F5F5F5',
        },
        dayNumberText: {
            fontSize: 13,
            fontWeight: 'bold',
            color: '#555',
        },
        // Schedule
        scheduleContainer: {
            flex: 1,
            backgroundColor: '#FFFFFF',
        },
        dateRowContainer: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
            minHeight: 60,
        },
        dateColumn: {
            width: 50,
            paddingVertical: 10,
            paddingHorizontal: 5,
            borderRightWidth: 1,
            borderRightColor: '#E0E0E0',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        dateRowNumberText: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#1D72F3',
        },
        dateRowDayText: {
            fontSize: 13,
            color: '#777',
        },
        scheduleItemsColumn: {
            flex: 1,
        },
        scheduleSlot: {
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
            paddingHorizontal: 10,
            paddingVertical: 10,
            marginHorizontal: 5,
            marginVertical: 5,
            backgroundColor: '#F8F9FA',
            borderRadius: 8,
            marginBottom: 10,
            marginTop: 10,
        },
        timeInfoColumn: {
            width: 45,
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 5,
        },
        timeText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: '#43546A',
            marginBottom: 3,
        },
        timeLine: {
            width: 1,
            height: 12,
            backgroundColor: '#43546A',
            marginVertical: 2,
        },
        // Event Details
        eventDetailsContainer: {
            flex: 1,
            paddingHorizontal: 10,
        },
        subjectNameText: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#43546A',
            marginBottom: 3,
        },
        eventInfoContainer: {
            flexDirection: 'column',
            marginBottom: 3,
        },
        roomText: {
            fontSize: 13,
            color: '#43546A',
            marginBottom: 3,
        },
        subjectCodeText: {
            fontSize: 13,
            color: '#555',
        },
        instructorText: {
            fontSize: 13,
            color: '#333',
            marginBottom: 3,
        },
        eventButtonsRow: {
            flexDirection: 'row',
        },
        presentButton: {
            paddingVertical: 3,
            paddingHorizontal: 10,
            backgroundColor: '#4CAF50',
            borderRadius: 12,
            marginRight: 5,
        },
        buttonText: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 'bold',
        },
        // Empty day
        emptyDayContainer: {
            minHeight: 60,
            justifyContent: 'center',
            alignItems: 'center',
            borderBottomWidth: 0,
            borderBottomColor: '#F0F0F0',
            flex: 1,
        },
        emptyDayText: {
            color: '#AAAAAA',
            fontSize: 13,
            fontStyle: 'italic',
        },
        // Loader and Errors
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 10,
            fontSize: 16,
            color: 'white',
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        errorText: {
            color: '#FF6B6B',
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 20,
        },
        refreshButton: {
            backgroundColor: '#1D72F3',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 5,
        },
        refreshButtonText: {
            color: 'white',
            fontWeight: 'bold',
        },
        errorBanner: {
            backgroundColor: '#FFEBEE',
            padding: 10,
            margin: 10,
            borderRadius: 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        errorBannerText: {
            color: '#D32F2F',
            fontSize: 14,
            flex: 1,
            marginRight: 10,
        },
    });

    return (
        <ImageBackground
            source={isDarkMode
                ? BACKGROUND_DARK
                : BACKGROUND_HOMEPAGE
            }
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.containerSafe}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <FontAwesome name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Weekly Schedule</Text>
                    <TouchableOpacity onPress={fetchScheduleData}>
                        <FontAwesome name="refresh" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Main Content Area with Rounded Corners */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Loading Schedule...</Text>
                    </View>
                ) : (
                    <View style={styles.contentArea}>
                        {/* Week Navigation */}
                        <View style={styles.weekNavigationContainer}>
                            <Text style={styles.currentWeekText}>Current week: {currentWeekRangeStr}</Text>
                            <View style={styles.weekNavigationControls}>
                                <TouchableOpacity onPress={handlePreviousWeek} style={styles.weekNavButton}>
                                    <FontAwesome name="chevron-left" size={20} color="#1D72F3" />
                                </TouchableOpacity>
                                <Text style={styles.monthYearText}>{currentMonthYearStr}</Text>
                                <TouchableOpacity onPress={handleNextWeek} style={styles.weekNavButton}>
                                    <FontAwesome name="chevron-right" size={20} color="#1D72F3" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Day Headers */}
                        <View style={styles.dayHeadersContainer}>
                            {dayLabels.map((day, index) => {
                                const date = currentWeekDates[index];
                                const dayNum = format(date, 'd');
                                const today = format(new Date(), 'd');
                                const isToday = dayNum === today && 
                                    isSameDay(date, new Date());
                                
                                return (
                                    <View key={day} style={styles.dayHeaderColumn}>
                                        <Text style={styles.dayHeaderText}>{day}</Text>
                                        <View style={[
                                            styles.dayNumberCircle,
                                            isToday && { backgroundColor: '#1D72F3' }
                                        ]}>
                                            <Text style={[
                                                styles.dayNumberText,
                                                isToday && { color: 'white' }
                                            ]}>{dayNum}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Schedule Grid */}
                        <ScrollView 
                            style={styles.scheduleContainer}
                            contentContainerStyle={{paddingBottom: 80}}
                            showsVerticalScrollIndicator={true}
                        >
                            {error && (
                                <View style={styles.errorBanner}>
                                    <Text style={styles.errorBannerText}>{error}</Text>
                                    <TouchableOpacity 
                                        style={styles.refreshButton}
                                        onPress={fetchScheduleData}
                                    >
                                        <Text style={styles.refreshButtonText}>Try Again</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            
                            {currentWeekDates.map((date, dateIndex) => {
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const events = scheduleData[dateKey] || [];
                                const dateDisplay = format(date, 'd/M');
                                const dayName = format(date, 'EEE');
                                
                                return (
                                    <View key={`date-${dateKey}`} style={styles.dateRowContainer}>
                                        {/* Left Column - Date */}
                                        <View style={styles.dateColumn}>
                                            <Text style={styles.dateRowNumberText}>{dateDisplay}</Text>
                                            <Text style={styles.dateRowDayText}>{dayName}</Text>
                                        </View>
                                        
                                        {/* Right Column - Schedule Items */}
                                        <View style={styles.scheduleItemsColumn}>
                                            {events.length > 0 ? (
                                                events.map((event, eventIndex) => 
                                                    renderEventItem(event, eventIndex)
                                                )
                                            ) : (
                                                <View style={styles.emptyDayContainer}>
                                                    <Text style={styles.emptyDayText}>No classes scheduled</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </SafeAreaView>
        </ImageBackground>
    );
};

export default Schedule;