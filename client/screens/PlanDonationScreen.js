import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Platform,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getFirestore, collection, getDocs, addDoc, query, where, doc as firestoreDoc } from "firebase/firestore";
import Colors from "../constants/Colors";
import * as FileSystem from 'expo-file-system'; 
import * as MediaLibrary from 'expo-media-library'; 
import { useUser } from "../store/UserContext";
import { useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notifications for iOS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function PlanDonationScreen() {
  const [medicalCenters, setMedicalCenters] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedCenterName, setSelectedCenterName] = useState("Оберіть центр");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRequestLabel, setSelectedRequestLabel] = useState("Оберіть запит");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showCenterPicker, setShowCenterPicker] = useState(false);
  const [showRequestPicker, setShowRequestPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);

  const db = getFirestore();
  const { user } = useUser();
  const route = useRoute();

  // Request notification permissions when the screen loads
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Function to request notification permissions for iOS
  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Увага', 'Не вдалося отримати дозвіл на надсилання повідомлень. Ви не отримаєте нагадувань перед донацією.');
        return;
      }
    }
  }

  // Schedule notifications for donation appointment
  const scheduleDonationNotifications = async (centerName, donationDate, donationTime) => {
    try {
      // Parse the date string into a Date object
      const dateParts = donationDate.split('.');
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(dateParts[2], 10);
      
      // Parse time
      const timeParts = donationTime.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10) || 0;
      
      // Create appointment date
      const appointmentDate = new Date(year, month, day, hours, minutes);
      
      // Immediate confirmation notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Запис на донацію підтверджено!',
          body: `Ви успішно записались на донацію в ${centerName} на ${donationDate} о ${donationTime}`,
        },
        trigger: null, // Send immediately
      });
      
      // Day before reminder (at 9 AM)
      const dayBeforeDate = new Date(appointmentDate);
      dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
      dayBeforeDate.setHours(9, 0, 0, 0);
      
      // Only schedule if the date is in the future
      if (dayBeforeDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Нагадування про донацію',
            body: `Завтра о ${donationTime} у вас запланована донація в ${centerName}`,
          },
          trigger: dayBeforeDate,
        });
      }
      
      // 2 hours before reminder
      const twoHoursBeforeDate = new Date(appointmentDate);
      twoHoursBeforeDate.setHours(twoHoursBeforeDate.getHours() - 2);
      
      // Only schedule if the date is in the future
      if (twoHoursBeforeDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Скоро донація!',
            body: `Через 2 години у вас запланована донація в ${centerName}`,
          },
          trigger: twoHoursBeforeDate,
        });
      }
      
      return true;
    } catch (error) {
      console.log('Error scheduling notifications:', error);
      return false;
    }
  };

  // Replace email sending with notifications
  const sendDonationConfirmation = async (userEmail, centerName, date, time) => {
    const success = await scheduleDonationNotifications(centerName, date, time);
    
    if (success) {
      Alert.alert('Успіх', 'Запис на донацію підтверджено! Ви отримаєте нагадування перед візитом.');
    } else {
      Alert.alert('Увага', 'Запис створено, але не вдалося налаштувати нагадування.');
    }
  };

  useEffect(() => {
    const fetchCenters = async () => {
        const centersSnapshot = await getDocs(collection(db, "medicalCenters"));
      setMedicalCenters(centersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCenters();
  }, [db]);
        
  // Fetch blood requests for selected center
  const fetchRequestsForCenter = async (centerId) => {
    setLoadingRequests(true);
    const centerRef = firestoreDoc(db, "medicalCenters", centerId);
    const q = query(collection(db, "bloodNeeds"), where("medicalCenterId", "==", centerRef));
    const requestsSnapshot = await getDocs(q);
    setBloodRequests(requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoadingRequests(false);
  };

  // Fetch booked times for selected center and date
  const fetchBookedTimes = async (centerId, date) => {
    if (!centerId || !date) return [];
    const q = query(
      collection(db, "donationRequests"),
      where("centerId", "==", centerId),
      where("date", "==", date.toISOString().split("T")[0])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().time);
  };

  // Generate available times based on working hours and booked times
  const getAvailableHours = (workingHours, date, bookedTimes) => {
    const days = [
      "неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"
    ];
    const dayName = days[date.getDay()];
    const hoursStr = workingHours?.[dayName];
    if (!hoursStr) return [];
    if (hoursStr === "цілодобово") {
      // Example: allow every hour from 00:00 to 23:00
      return Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, "0")}:00`).filter(t => !bookedTimes.includes(t));
    }
    const [start, end] = hoursStr.split("-");
    if (!start || !end) return [];
    const startHour = parseInt(start.split(":")[0]);
    const endHour = parseInt(end.split(":")[0]);
    let times = [];
    for (let h = startHour; h < endHour; h++) {
      const time = `${h.toString().padStart(2, "0")}:00`;
      if (!bookedTimes.includes(time)) times.push(time);
    }
    return times;
  };

  // When center or date changes, update available times
  useEffect(() => {
    const updateAvailableTimes = async () => {
      if (!selectedCenter) return;
      const center = medicalCenters.find(c => c.id === selectedCenter);
      if (!center) return;
      const booked = await fetchBookedTimes(selectedCenter, date);
      setBookedTimes(booked);
      const times = getAvailableHours(center.workingHours, date, booked);
      setAvailableTimes(times);
      // If selectedTime is now unavailable, reset it
      if (selectedTime && !times.includes(selectedTime)) setSelectedTime(null);
    };
    updateAvailableTimes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenter, date, medicalCenters]);

  // Preselect center and request if passed via navigation
  useEffect(() => {
    if (route.params?.medicalCenterId) {
      setSelectedCenter(route.params.medicalCenterId);
      const center = medicalCenters.find(c => c.id === route.params.medicalCenterId);
      setSelectedCenterName(center?.nameCenter || center?.name || "Оберіть центр");
      fetchRequestsForCenter(route.params.medicalCenterId);
    }
  }, [route.params?.medicalCenterId, medicalCenters]);

  useEffect(() => {
    if (route.params?.needId && bloodRequests.length > 0) {
      setSelectedRequest(route.params.needId);
      const req = bloodRequests.find(r => r.id === route.params.needId);
      setSelectedRequestLabel(`${req?.bloodGroup || req?.type} - потрібно: ${req?.neededAmount || req?.urgency}`);
    }
  }, [route.params?.needId, bloodRequests]);

  const handleCenterSelect = (center) => {
    setSelectedCenter(center.id);
    setSelectedCenterName(center.nameCenter || center.name || "Оберіть центр");
    setSelectedRequest(null);
    setSelectedRequestLabel("Оберіть запит");
    fetchRequestsForCenter(center.id);
    setShowCenterPicker(false);
  };

  const handleRequestSelect = (request) => {
    setSelectedRequest(request.id);
    setSelectedRequestLabel(`${request.bloodGroup || request.type} - потрібно: ${request.neededAmount || request.urgency}`);
    setShowRequestPicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedCenter || !selectedRequest || !selectedTime) {
      Alert.alert("Помилка", "Оберіть центр, запит та час.");
      return;
    }
    try {
      await addDoc(collection(db, "donationRequests"), {
        donorId: user?.uid || "unknown",
        centerId: selectedCenter,
        bloodNeedId: selectedRequest,
        date: date.toISOString().split("T")[0],
        time: selectedTime,
        status: "pending",
      });

      // Send confirmation via notifications instead of email
      await sendDonationConfirmation(
        user.email,
        selectedCenterName,
        formatDate(date),
        selectedTime
      );

      Alert.alert(
        "Успіх", 
        "Ваш запит на донацію створено! Ви отримаєте нагадування перед візитом.",
        [
          {
            text: "OK",
            onPress: () => setShowInstructionModal(true)
          }
        ]
      );
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Помилка", "Не вдалося записатися на донацію.");
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Планування донації</Text>
          <Text style={styles.subHeader}>Оберіть зручний час та місце</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Медичний центр */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Медичний центр:</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowCenterPicker(true)}
            >
              <Text style={styles.selectButtonText}>{selectedCenterName}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          {/* Запит на кров */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Запит на кров:</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => selectedCenter ? setShowRequestPicker(true) : Alert.alert("Оберіть центр спочатку")}
              disabled={!selectedCenter || loadingRequests}
            >
              <Text style={styles.selectButtonText}>{loadingRequests ? "Завантаження..." : selectedRequestLabel}</Text>
              <Ionicons name="water" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          {/* Дата */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Дата донації:</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => {
                Platform.OS === 'ios' ? setShowDatePicker(true) : setShowAndroidDatePicker(true);
              }}
            >
              <Text style={styles.selectButtonText}>{formatDate(date)}</Text>
              <Ionicons name="calendar" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          {/* Час */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Час:</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowTimePicker(true)}
              disabled={availableTimes.length === 0}
            >
              <Text style={styles.selectButtonText}>{selectedTime || "Оберіть час"}</Text>
              <Ionicons name="time" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={24} color={Colors.accent500} />
            <Text style={styles.infoText}>
              Після підтвердження запису, ви отримаєте повідомлення з деталями вашого візиту.
              Не забудьте взяти з собою паспорт та підготуватись до процедури.
            </Text>
          </View>

          {/* Кнопка запису */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Підтвердити запис</Text>
          </TouchableOpacity>
        </View>

        {/* iOS Date Picker */}
        {showDatePicker && (
          <Modal
            transparent={true}
            visible={showDatePicker}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.modalTitle}>Оберіть дату</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={24} color={Colors.textDark} />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // +30 days
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setDate(selectedDate);
                  }}
                  style={styles.datePicker}
                />
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>Підтвердити</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        
        {/* Android Date Picker */}
        {showAndroidDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // +30 days
            onChange={(event, selectedDate) => {
              setShowAndroidDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Modal for Medical Centers */}
        <Modal
          visible={showCenterPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Оберіть медичний центр</Text>
                <TouchableOpacity onPress={() => setShowCenterPicker(false)}>
                  <Ionicons name="close" size={24} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {medicalCenters.map((center) => (
                  <TouchableOpacity
                    key={center.id}
                    style={styles.modalItem}
                    onPress={() => handleCenterSelect(center)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedCenter === center.id && styles.selectedModalItemText
                    ]}>
                      {center.nameCenter || center.name}
                    </Text>
                    {selectedCenter === center.id && (
                      <Ionicons name="checkmark" size={20} color={Colors.accent500} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal for Blood Requests */}
        <Modal
          visible={showRequestPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Оберіть запит на кров</Text>
                <TouchableOpacity onPress={() => setShowRequestPicker(false)}>
                  <Ionicons name="close" size={24} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {bloodRequests.length === 0 && (
                  <Text style={{ textAlign: 'center', marginTop: 20 }}>Немає запитів для цього центру</Text>
                )}
                {bloodRequests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.modalItem}
                    onPress={() => handleRequestSelect(request)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedRequest === request.id && styles.selectedModalItemText
                    ]}>
                      {request.bloodGroup || request.type} - потрібно: {request.neededAmount || request.urgency}
                    </Text>
                    {selectedRequest === request.id && (
                      <Ionicons name="checkmark" size={20} color={Colors.accent500} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal for Time Selection */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Оберіть час</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color={Colors.textDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.timeGrid}>
                {availableTimes.length === 0 && (
                  <Text style={{ textAlign: 'center', marginTop: 20 }}>Немає доступних годин</Text>
                )}
                {availableTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeItem,
                      selectedTime === time && styles.selectedTimeItem
                    ]}
                    onPress={() => {
                      setSelectedTime(time);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.timeItemText,
                      selectedTime === time && styles.selectedTimeItemText
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal for Instruction Image */}
        <Modal
          visible={showInstructionModal}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowInstructionModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <ScrollView
              maximumZoomScale={3}
              minimumZoomScale={1}
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
            >
              <Image
                source={require("../assets/images/donor_instructons.png")}
                style={{ width: "100%", height: undefined, aspectRatio: 0.7, resizeMode: "contain" }}
              />
            </ScrollView>
            <View style={{ position: "absolute", top: 40, right: 20, flexDirection: "row" }}>
              <TouchableOpacity
                onPress={async () => {
                  // Download and save to gallery (Expo example)
                  const asset = require("../assets/images/donor_instructons.png");
                  const fileUri = FileSystem.documentDirectory + "donor_instructons.png";
                  await FileSystem.copyAsync({
                    from: asset,
                    to: fileUri,
                  });
                  await MediaLibrary.saveToLibraryAsync(fileUri);
                  Alert.alert("Збережено", "Зображення збережено у вашій галереї.");
                }}
                style={{ marginRight: 20 }}
              >
                <Ionicons name="download" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowInstructionModal(false)}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  headerContainer: {
    backgroundColor: Colors.accent500,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    fontFamily: "e-Ukraine-B",
    fontSize: 24,
    color: Colors.white,
    marginBottom: 10,
  },
  subHeader: {
    fontFamily: "e-Ukraine-L",
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -18,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 8,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  datePickerContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
    width: "100%",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey200,
  },
  datePicker: {
    height: 200,
    marginBottom: 16,
  },
  datePickerButton: {
    backgroundColor: Colors.accent500,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  datePickerButtonText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.white,
  },
  selectButtonText: {
    fontFamily: "e-Ukraine-R",
    fontSize: 16,
    color: Colors.text,
  },
  infoSection: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.textDark,
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.accent500,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey200,
  },
  modalTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 18,
    color: Colors.textDark,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey100,
  },
  modalItemText: {
    fontFamily: "e-Ukraine-R",
    fontSize: 16,
    color: Colors.text,
  },
  selectedModalItemText: {
    color: Colors.accent500,
    fontFamily: "e-Ukraine-M",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timeItem: {
    width: "31%",
    marginRight: "2%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  selectedTimeItem: {
    backgroundColor: Colors.accent500,
    borderColor: Colors.accent500,
  },
  timeItemText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.text,
  },
  selectedTimeItemText: {
    color: Colors.white,
  },
});

    // import React, { useEffect, useState } from "react";
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   Modal,
//   Platform,
//   Image,
//   Share
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { getFirestore, collection, getDocs, addDoc, query, where, doc as firestoreDoc } from "firebase/firestore";
// import Colors from "../constants/Colors";
// import * as FileSystem from 'expo-file-system'; 
// import * as MediaLibrary from 'expo-media-library'; 
// import { useUser } from "../store/UserContext";
// import { useRoute } from '@react-navigation/native';

// export default function PlanDonationScreen() {
//   const [medicalCenters, setMedicalCenters] = useState([]);
//   const [bloodRequests, setBloodRequests] = useState([]);
//   const [selectedCenter, setSelectedCenter] = useState(null);
//   const [selectedCenterName, setSelectedCenterName] = useState("Оберіть центр");
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [selectedRequestLabel, setSelectedRequestLabel] = useState("Оберіть запит");
//   const [date, setDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
//   const [selectedTime, setSelectedTime] = useState(null);
//   const [showCenterPicker, setShowCenterPicker] = useState(false);
//   const [showRequestPicker, setShowRequestPicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [showInstructionModal, setShowInstructionModal] = useState(false);
//   const [loadingRequests, setLoadingRequests] = useState(false);
//   const [availableTimes, setAvailableTimes] = useState([]);
//   const [bookedTimes, setBookedTimes] = useState([]);

//   const db = getFirestore();
//   const { user } = useUser();
//   const route = useRoute();

//   useEffect(() => {
//     const fetchCenters = async () => {
//         const centersSnapshot = await getDocs(collection(db, "medicalCenters"));
//       setMedicalCenters(centersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//     };
//     fetchCenters();
//   }, [db]);
        
//   // Fetch blood requests for selected center
//   const fetchRequestsForCenter = async (centerId) => {
//     setLoadingRequests(true);
//     const centerRef = firestoreDoc(db, "medicalCenters", centerId);
//     const q = query(collection(db, "bloodNeeds"), where("medicalCenterId", "==", centerRef));
//     const requestsSnapshot = await getDocs(q);
//     setBloodRequests(requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//     setLoadingRequests(false);
//   };

//   // Fetch booked times for selected center and date
//   const fetchBookedTimes = async (centerId, date) => {
//     if (!centerId || !date) return [];
//     const q = query(
//       collection(db, "donationRequests"),
//       where("centerId", "==", centerId),
//       where("date", "==", date.toISOString().split("T")[0])
//     );
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map(doc => doc.data().time);
//   };

//   // Generate available times based on working hours and booked times
//   const getAvailableHours = (workingHours, date, bookedTimes) => {
//     const days = [
//       "неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"
//     ];
//     const dayName = days[date.getDay()];
//     const hoursStr = workingHours?.[dayName];
//     if (!hoursStr) return [];
//     if (hoursStr === "цілодобово") {
//       // Example: allow every hour from 00:00 to 23:00
//       return Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, "0")}:00`).filter(t => !bookedTimes.includes(t));
//     }
//     const [start, end] = hoursStr.split("-");
//     if (!start || !end) return [];
//     const startHour = parseInt(start.split(":")[0]);
//     const endHour = parseInt(end.split(":")[0]);
//     let times = [];
//     for (let h = startHour; h < endHour; h++) {
//       const time = `${h.toString().padStart(2, "0")}:00`;
//       if (!bookedTimes.includes(time)) times.push(time);
//     }
//     return times;
//   };

//   // When center or date changes, update available times
//   useEffect(() => {
//     const updateAvailableTimes = async () => {
//       if (!selectedCenter) return;
//       const center = medicalCenters.find(c => c.id === selectedCenter);
//       if (!center) return;
//       const booked = await fetchBookedTimes(selectedCenter, date);
//       setBookedTimes(booked);
//       const times = getAvailableHours(center.workingHours, date, booked);
//       setAvailableTimes(times);
//       // If selectedTime is now unavailable, reset it
//       if (selectedTime && !times.includes(selectedTime)) setSelectedTime(null);
//     };
//     updateAvailableTimes();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedCenter, date, medicalCenters]);

//   // Preselect center and request if passed via navigation
//   useEffect(() => {
//     if (route.params?.medicalCenterId) {
//       setSelectedCenter(route.params.medicalCenterId);
//       const center = medicalCenters.find(c => c.id === route.params.medicalCenterId);
//       setSelectedCenterName(center?.nameCenter || center?.name || "Оберіть центр");
//       fetchRequestsForCenter(route.params.medicalCenterId);
//     }
//   }, [route.params?.medicalCenterId, medicalCenters]);

//   useEffect(() => {
//     if (route.params?.needId && bloodRequests.length > 0) {
//       setSelectedRequest(route.params.needId);
//       const req = bloodRequests.find(r => r.id === route.params.needId);
//       setSelectedRequestLabel(`${req?.bloodGroup || req?.type} - потрібно: ${req?.neededAmount || req?.urgency}`);
//     }
//   }, [route.params?.needId, bloodRequests]);

//   const handleCenterSelect = (center) => {
//     setSelectedCenter(center.id);
//     setSelectedCenterName(center.nameCenter || center.name || "Оберіть центр");
//     setSelectedRequest(null);
//     setSelectedRequestLabel("Оберіть запит");
//     fetchRequestsForCenter(center.id);
//     setShowCenterPicker(false);
//   };

//   const handleRequestSelect = (request) => {
//     setSelectedRequest(request.id);
//     setSelectedRequestLabel(`${request.bloodGroup || request.type} - потрібно: ${request.neededAmount || request.urgency}`);
//     setShowRequestPicker(false);
//   };

//   const sendDonationConfirmation = async (userEmail, centerName, date, time) => {
//     const serviceID = 'service_cez9las';
//     const templateID = 'template_viqbv4h';
//     const publicKey = 'ah3RLpS4fFIS5lBTh';

//     const templateParams = {
//       to_email: userEmail,
//       center_name: centerName,
//       donation_date: date,
//       donation_time: time,
//     };

//     try {
//       const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           service_id: serviceID,
//           template_id: templateID,
//           user_id: publicKey,
//           template_params: templateParams,
//         }),
//       });

//       if (response.ok) {
//         Alert.alert('Успіх', 'Деталі запису надіслано на вашу пошту!');
//       } else {
//         const errorText = await response.text();
//         console.log('FAILED...', errorText);
//         Alert.alert('Помилка', 'Не вдалося надіслати лист.');
//       }
//     } catch (err) {
//       console.log('FAILED...', err);
//       Alert.alert('Помилка', 'Не вдалося надіслати лист.');
//     }
//   };

//   const handleSubmit = async () => {
//     if (!selectedCenter || !selectedRequest || !selectedTime) {
//       Alert.alert("Помилка", "Оберіть центр, запит та час.");
//       return;
//     }
//     try {
//       await addDoc(collection(db, "donationRequests"), {
//         donorId: user?.uid || "unknown",
//         centerId: selectedCenter,
//         bloodNeedId: selectedRequest,
//         date: date.toISOString().split("T")[0],
//         time: selectedTime,
//         status: "pending",
//       });

//       // Send confirmation email
//       sendDonationConfirmation(
//         user.email,
//         selectedCenterName,
//         formatDate(date),
//         selectedTime
//       );

//       Alert.alert(
//         "Успіх", 
//         "Ваш запит на донацію створено!",
//         [
//           {
//             text: "OK",
//             onPress: () => setShowInstructionModal(true)
//           }
//         ]
//       );
//     } catch (error) {
//       Alert.alert("Помилка", "Не вдалося записатися на донацію.");
//     }
//   };

//   const formatDate = (date) => {
//     const day = date.getDate().toString().padStart(2, '0');
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const year = date.getFullYear();
//     return `${day}.${month}.${year}`;
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
//         {/* Header */}
//         <View style={styles.headerContainer}>
//           <Text style={styles.header}>Планування донації</Text>
//           <Text style={styles.subHeader}>Оберіть зручний час та місце</Text>
//         </View>

//         <View style={styles.formContainer}>
//           {/* Медичний центр */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Медичний центр:</Text>
//             <TouchableOpacity 
//               style={styles.selectButton}
//               onPress={() => setShowCenterPicker(true)}
//             >
//               <Text style={styles.selectButtonText}>{selectedCenterName}</Text>
//               <Ionicons name="chevron-down" size={20} color={Colors.inactiveDark} />
//             </TouchableOpacity>
//           </View>

//           {/* Запит на кров */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Запит на кров:</Text>
//             <TouchableOpacity 
//               style={styles.selectButton}
//               onPress={() => selectedCenter ? setShowRequestPicker(true) : Alert.alert("Оберіть центр спочатку")}
//               disabled={!selectedCenter || loadingRequests}
//             >
//               <Text style={styles.selectButtonText}>{loadingRequests ? "Завантаження..." : selectedRequestLabel}</Text>
//               <Ionicons name="water" size={20} color={Colors.inactiveDark} />
//             </TouchableOpacity>
//           </View>

//           {/* Дата */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Дата донації:</Text>
//             <TouchableOpacity 
//               style={styles.selectButton}
//               onPress={() => {
//                 Platform.OS === 'ios' ? setShowDatePicker(true) : setShowAndroidDatePicker(true);
//               }}
//             >
//               <Text style={styles.selectButtonText}>{formatDate(date)}</Text>
//               <Ionicons name="calendar" size={20} color={Colors.inactiveDark} />
//             </TouchableOpacity>
//           </View>

//           {/* Час */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Час:</Text>
//             <TouchableOpacity 
//               style={styles.selectButton}
//               onPress={() => setShowTimePicker(true)}
//               disabled={availableTimes.length === 0}
//             >
//               <Text style={styles.selectButtonText}>{selectedTime || "Оберіть час"}</Text>
//               <Ionicons name="time" size={20} color={Colors.inactiveDark} />
//             </TouchableOpacity>
//           </View>

//           {/* Info Section */}
//           <View style={styles.infoSection}>
//             <Ionicons name="information-circle" size={24} color={Colors.accent500} />
//             <Text style={styles.infoText}>
//               Після підтвердження запису, ви отримаєте повідомлення з деталями вашого візиту.
//               Не забудьте взяти з собою паспорт та підготуватись до процедури.
//             </Text>
//           </View>

//           {/* Кнопка запису */}
//           <TouchableOpacity 
//             style={styles.submitButton}
//             onPress={handleSubmit}
//           >
//             <Text style={styles.submitButtonText}>Підтвердити запис</Text>
//           </TouchableOpacity>
//         </View>

//         {/* iOS Date Picker */}
//         {showDatePicker && (
//           <Modal
//             transparent={true}
//             visible={showDatePicker}
//             animationType="slide"
//           >
//             <View style={styles.modalOverlay}>
//               <View style={styles.datePickerContainer}>
//                 <View style={styles.datePickerHeader}>
//                   <Text style={styles.modalTitle}>Оберіть дату</Text>
//                   <TouchableOpacity onPress={() => setShowDatePicker(false)}>
//                     <Ionicons name="close" size={24} color={Colors.textDark} />
//                   </TouchableOpacity>
//                 </View>
//                 <DateTimePicker
//                   value={date}
//                   mode="date"
//                   display="spinner"
//                   minimumDate={new Date()}
//                   maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // +30 days
//                   onChange={(event, selectedDate) => {
//                     if (selectedDate) setDate(selectedDate);
//                   }}
//                   style={styles.datePicker}
//                 />
//                 <TouchableOpacity 
//                   style={styles.datePickerButton}
//                   onPress={() => setShowDatePicker(false)}
//                 >
//                   <Text style={styles.datePickerButtonText}>Підтвердити</Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </Modal>
//         )}
        
//         {/* Android Date Picker */}
//         {showAndroidDatePicker && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="default"
//             minimumDate={new Date()}
//             maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // +30 days
//             onChange={(event, selectedDate) => {
//               setShowAndroidDatePicker(false);
//               if (selectedDate) setDate(selectedDate);
//             }}
//           />
//         )}

//         {/* Modal for Medical Centers */}
//         <Modal
//           visible={showCenterPicker}
//           transparent={true}
//           animationType="slide"
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>Оберіть медичний центр</Text>
//                 <TouchableOpacity onPress={() => setShowCenterPicker(false)}>
//                   <Ionicons name="close" size={24} color={Colors.textDark} />
//                 </TouchableOpacity>
//               </View>
//               <ScrollView style={styles.modalScroll}>
//                 {medicalCenters.map((center) => (
//                   <TouchableOpacity
//                     key={center.id}
//                     style={styles.modalItem}
//                     onPress={() => handleCenterSelect(center)}
//                   >
//                     <Text style={[
//                       styles.modalItemText,
//                       selectedCenter === center.id && styles.selectedModalItemText
//                     ]}>
//                       {center.nameCenter || center.name}
//                     </Text>
//                     {selectedCenter === center.id && (
//                       <Ionicons name="checkmark" size={20} color={Colors.accent500} />
//                     )}
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           </View>
//         </Modal>

//         {/* Modal for Blood Requests */}
//         <Modal
//           visible={showRequestPicker}
//           transparent={true}
//           animationType="slide"
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>Оберіть запит на кров</Text>
//                 <TouchableOpacity onPress={() => setShowRequestPicker(false)}>
//                   <Ionicons name="close" size={24} color={Colors.textDark} />
//                 </TouchableOpacity>
//               </View>
//               <ScrollView style={styles.modalScroll}>
//                 {bloodRequests.length === 0 && (
//                   <Text style={{ textAlign: 'center', marginTop: 20 }}>Немає запитів для цього центру</Text>
//                 )}
//                 {bloodRequests.map((request) => (
//                   <TouchableOpacity
//                     key={request.id}
//                     style={styles.modalItem}
//                     onPress={() => handleRequestSelect(request)}
//                   >
//                     <Text style={[
//                       styles.modalItemText,
//                       selectedRequest === request.id && styles.selectedModalItemText
//                     ]}>
//                       {request.bloodGroup || request.type} - потрібно: {request.neededAmount || request.urgency}
//                     </Text>
//                     {selectedRequest === request.id && (
//                       <Ionicons name="checkmark" size={20} color={Colors.accent500} />
//                     )}
//                   </TouchableOpacity>
//                 ))}
//               </ScrollView>
//             </View>
//           </View>
//         </Modal>

//         {/* Modal for Time Selection */}
//         <Modal
//           visible={showTimePicker}
//           transparent={true}
//           animationType="slide"
//         >
//           <View style={styles.modalOverlay}>
//             <View style={styles.modalContent}>
//               <View style={styles.modalHeader}>
//                 <Text style={styles.modalTitle}>Оберіть час</Text>
//                 <TouchableOpacity onPress={() => setShowTimePicker(false)}>
//                   <Ionicons name="close" size={24} color={Colors.textDark} />
//                 </TouchableOpacity>
//               </View>
//               <View style={styles.timeGrid}>
//                 {availableTimes.length === 0 && (
//                   <Text style={{ textAlign: 'center', marginTop: 20 }}>Немає доступних годин</Text>
//                 )}
//                 {availableTimes.map((time) => (
//                   <TouchableOpacity
//                     key={time}
//                     style={[
//                       styles.timeItem,
//                       selectedTime === time && styles.selectedTimeItem
//                     ]}
//                     onPress={() => {
//                       setSelectedTime(time);
//                       setShowTimePicker(false);
//                     }}
//                   >
//                     <Text style={[
//                       styles.timeItemText,
//                       selectedTime === time && styles.selectedTimeItemText
//                     ]}>
//                       {time}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </View>
//           </View>
//         </Modal>

//         {/* Modal for Instruction Image */}
//         <Modal
//           visible={showInstructionModal}
//           transparent={false}
//           animationType="slide"
//           onRequestClose={() => setShowInstructionModal(false)}
//         >
//           <View style={{ flex: 1, backgroundColor: "#000" }}>
//             <ScrollView
//               maximumZoomScale={3}
//               minimumZoomScale={1}
//               contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
//             >
//               <Image
//                 source={require("../assets/images/donor_instructons.png")}
//                 style={{ width: "100%", height: undefined, aspectRatio: 0.7, resizeMode: "contain" }}
//               />
//             </ScrollView>
//             <View style={{ position: "absolute", top: 40, right: 20, flexDirection: "row" }}>
//               <TouchableOpacity
//                 onPress={async () => {
//                   // Download and save to gallery (Expo example)
//                   const asset = require("../assets/images/donor_instructons.png");
//                   const fileUri = FileSystem.documentDirectory + "donor_instructons.png";
//                   await FileSystem.copyAsync({
//                     from: asset,
//                     to: fileUri,
//                   });
//                   await MediaLibrary.saveToLibraryAsync(fileUri);
//                   Alert.alert("Збережено", "Зображення збережено у вашій галереї.");
//                 }}
//                 style={{ marginRight: 20 }}
//               >
//                 <Ionicons name="download" size={32} color="#fff" />
//               </TouchableOpacity>
//               <TouchableOpacity onPress={() => setShowInstructionModal(false)}>
//                 <Ionicons name="close" size={32} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: Colors.backgroundAlt,
//   },
//   container: {
//     flex: 1,
//   },
//   contentContainer: {
//     flexGrow: 1,
//     paddingBottom: 24,
//   },
//   headerContainer: {
//     backgroundColor: Colors.accent500,
//     paddingTop: 60,
//     paddingBottom: 24,
//     paddingHorizontal: 20,
//   },
//   header: {
//     fontFamily: "e-Ukraine-B",
//     fontSize: 24,
//     color: Colors.white,
//     marginBottom: 10,
//   },
//   subHeader: {
//     fontFamily: "e-Ukraine-L",
//     fontSize: 16,
//     color: Colors.white,
//     opacity: 0.9,
//     marginBottom: 10,
//   },
//   formContainer: {
//     backgroundColor: Colors.white,
//     marginHorizontal: 16,
//     marginTop: -18,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingTop: 24,
//     paddingBottom: 24,
//     shadowColor: Colors.shadow,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   formGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontFamily: "e-Ukraine-M",
//     fontSize: 16,
//     color: Colors.textDark,
//     marginBottom: 8,
//   },
//   selectButton: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: Colors.grey200,
//     borderRadius: 8,
//     backgroundColor: Colors.background,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//   },
//   datePickerContainer: {
//     backgroundColor: Colors.white,
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     paddingBottom: 16,
//     width: "100%",
//   },
//   datePickerHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.grey200,
//   },
//   datePicker: {
//     height: 200,
//     marginBottom: 16,
//   },
//   datePickerButton: {
//     backgroundColor: Colors.accent500,
//     marginHorizontal: 16,
//     paddingVertical: 14,
//     borderRadius: 25,
//     alignItems: "center",
//   },
//   datePickerButtonText: {
//     fontFamily: "e-Ukraine-M",
//     fontSize: 16,
//     color: Colors.white,
//   },
//   selectButtonText: {
//     fontFamily: "e-Ukraine-R",
//     fontSize: 16,
//     color: Colors.text,
//   },
//   infoSection: {
//     backgroundColor: Colors.primaryLight,
//     borderRadius: 8,
//     padding: 16,
//     marginVertical: 16,
//     flexDirection: "row",
//     alignItems: "flex-start",
//   },
//   infoText: {
//     fontFamily: "e-Ukraine-L",
//     fontSize: 14,
//     color: Colors.textDark,
//     marginLeft: 12,
//     flex: 1,
//   },
//   submitButton: {
//     backgroundColor: Colors.accent500,
//     borderRadius: 25,
//     paddingVertical: 16,
//     alignItems: "center",
//     marginTop: 8,
//   },
//   submitButtonText: {
//     fontFamily: "e-Ukraine-M",
//     fontSize: 16,
//     color: Colors.white,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     backgroundColor: Colors.white,
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     paddingVertical: 16,
//     maxHeight: "70%",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.grey200,
//   },
//   modalTitle: {
//     fontFamily: "e-Ukraine-M",
//     fontSize: 18,
//     color: Colors.textDark,
//   },
//   modalScroll: {
//     maxHeight: 400,
//   },
//   modalItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.grey100,
//   },
//   modalItemText: {
//     fontFamily: "e-Ukraine-R",
//     fontSize: 16,
//     color: Colors.text,
//   },
//   selectedModalItemText: {
//     color: Colors.accent500,
//     fontFamily: "e-Ukraine-M",
//   },
//   timeGrid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     paddingHorizontal: 16,
//     paddingTop: 16,
//   },
//   timeItem: {
//     width: "31%",
//     marginRight: "2%",
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: Colors.grey200,
//     borderRadius: 8,
//     paddingVertical: 12,
//     alignItems: "center",
//   },
//   selectedTimeItem: {
//     backgroundColor: Colors.accent500,
//     borderColor: Colors.accent500,
//   },
//   timeItemText: {
//     fontFamily: "e-Ukraine-M",
//     fontSize: 16,
//     color: Colors.text,
//   },
//   selectedTimeItemText: {
//     color: Colors.white,
//   },
// });