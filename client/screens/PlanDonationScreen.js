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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc as firestoreDoc,
  getDoc,
} from "firebase/firestore";
import Colors from "../constants/Colors";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useRoute } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { db } from "../firebase/firebase";
import { useUser } from "../store/UserContext";

// Blood group compatibility function
const isCompatible = (donorGroup, recipientGroup) => {
  const compat = {
    "1+": ["1+", "2+", "3+", "4+"],
    "1-": ["1+", "1-", "2+", "2-", "3+", "3-", "4+", "4-"],
    "2+": ["2+", "4+"],
    "2-": ["2+", "2-", "4+", "4-"],
    "3+": ["3+", "4+"],
    "3-": ["3+", "3-", "4+", "4-"],
    "4+": ["4+"],
    "4-": ["4+", "4-"],
  };
  return compat[donorGroup]?.includes(recipientGroup);
};

// Add function to get compatibility description
const getCompatibilityDescription = (donorGroup) => {
  const descriptions = {
    "1+": "Можна здавати кров для груп 1+, 2+, 3+, 4+",
    "1-": "Універсальний донор. Можна здавати кров для всіх груп.",
    "2+": "Можна здавати кров для груп 2+ та 4+",
    "2-": "Можна здавати кров для груп 2+, 2-, 4+, 4-",
    "3+": "Можна здавати кров для груп 3+ та 4+",
    "3-": "Можна здавати кров для груп 3+, 3-, 4+, 4-",
    "4+": "Можна здавати кров тільки для групи 4+",
    "4-": "Можна здавати кров для груп 4+ та 4-",
  };
  return descriptions[donorGroup] || "Невідома група крові";
};

// Configure notifications for iOS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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
  const [selectedTime, setSelectedTime] = useState(null);
  const [showCenterPicker, setShowCenterPicker] = useState(false);
  const [showRequestPicker, setShowRequestPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [nextPossibleDate, setNextPossibleDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const { user } = useUser();
  const route = useRoute();

  if (user === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Завантаження профілю...</Text>
      </View>
    );
  }

  if (!user.bloodType) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          У вашому профілі не вказано групу крові. Будь ласка, додайте її у профілі!
        </Text>
        <Text style={{ color: 'black', fontSize: 12, textAlign: 'center' }}>
          {JSON.stringify(user, null, 2)}
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (route.params?.medicalCenterId && medicalCenters.length > 0) {
      const center = medicalCenters.find(c => c.id === route.params.medicalCenterId);
      if (center) {
        setSelectedCenter(center.id);
        setSelectedCenterName(center.nameCenter || center.name || "Оберіть центр");
        fetchRequestsForCenter(center.id);
      }
    }
  }, [route.params?.medicalCenterId, medicalCenters]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Увага",
          "Не вдалося отримати дозвіл на надсилання повідомлень. Ви не отримаєте нагадувань перед донацією."
        );
        return;
      }
    }
  }

  const scheduleDonationNotifications = async (
    centerName,
    donationDate,
    donationTime
  ) => {
    try {
      const dateParts = donationDate.split(".");
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);

      const timeParts = donationTime.split(":");
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10) || 0;

      const appointmentDate = new Date(year, month, day, hours, minutes);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Запис на донацію підтверджено!",
          body: `Ви успішно записались на донацію в ${centerName} на ${donationDate} о ${donationTime}`,
        },
        trigger: null,
      });

      const dayBeforeDate = new Date(appointmentDate);
      dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
      dayBeforeDate.setHours(9, 0, 0, 0);

      if (dayBeforeDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Нагадування про донацію",
            body: `Завтра о ${donationTime} у вас запланована донація в ${centerName}`,
          },
          trigger: { type: "date", date: dayBeforeDate },
        });
      }

      const twoHoursBeforeDate = new Date(appointmentDate);
      twoHoursBeforeDate.setHours(twoHoursBeforeDate.getHours() - 2);

      if (twoHoursBeforeDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Скоро донація!",
            body: `Через 2 години у вас запланована донація в ${centerName}`,
          },
          trigger: { type: "date", date: twoHoursBeforeDate },
        });
      }

      return true;
    } catch (error) {
      console.log("Error scheduling notifications:", error);
      return false;
    }
  };

  const sendDonationConfirmation = async (
    userEmail,
    centerName,
    date,
    time
  ) => {
    const success = await scheduleDonationNotifications(centerName, date, time);

    if (success) {
      Alert.alert(
        "Успіх",
        "Запис на донацію підтверджено! Ви отримаєте нагадування перед візитом."
      );
    } else {
      Alert.alert(
        "Увага",
        "Запис створено, але не вдалося налаштувати нагадування."
      );
    }
  };

  useEffect(() => {
    const fetchCenters = async () => {
      const centersSnapshot = await getDocs(collection(db, "medicalCenters"));
      setMedicalCenters(
        centersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchCenters();
  }, [db]);

  const fetchRequestsForCenter = async (centerId) => {
    setLoadingRequests(true);
    const centerRef = firestoreDoc(db, "medicalCenters", centerId);
    const q = query(
      collection(db, "bloodNeeds"),
      where("medicalCenterId", "==", centerRef)
    );
    const requestsSnapshot = await getDocs(q);
    
    const donorGroup = user?.bloodType;
    
    const filteredRequests = requestsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (need) =>
          (need.collectedAmount || 0) < (need.neededAmount || 1) &&
          need.status !== "завершено" &&
          isCompatible(donorGroup, need.bloodGroup)
      );

    setBloodRequests(filteredRequests);
    setLoadingRequests(false);
  };

  const fetchBookedTimes = async (centerId, date) => {
    if (!centerId || !date) return [];
    const q = query(
      collection(db, "donationRequests"),
      where("centerId", "==", centerId),
      where("date", "==", date.toISOString().split("T")[0])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data().time);
  };

  const getAvailableHours = (workingHours, date, bookedTimes) => {
    const days = [
      "неділя",
      "понеділок",
      "вівторок",
      "середа",
      "четвер",
      "п'ятниця",
      "субота",
    ];
    const dayName = days[date.getDay()];
    const hoursStr = workingHours?.[dayName];
    if (!hoursStr) return [];
    if (hoursStr === "цілодобово") {
      return Array.from(
        { length: 24 },
        (_, h) => `${h.toString().padStart(2, "0")}:00`
      ).filter((t) => !bookedTimes.includes(t));
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

  useEffect(() => {
    const updateAvailableTimes = async () => {
      if (!selectedCenter) return;
      const center = medicalCenters.find((c) => c.id === selectedCenter);
      if (!center) return;
      const booked = await fetchBookedTimes(selectedCenter, date);
      setBookedTimes(booked);
      const times = getAvailableHours(center.workingHours, date, booked);
      setAvailableTimes(times);
      if (selectedTime && !times.includes(selectedTime)) setSelectedTime(null);
    };
    updateAvailableTimes();
  }, [selectedCenter, date, medicalCenters]);

  useEffect(() => {
    if (route.params?.needId && bloodRequests.length > 0) {
      setSelectedRequest(route.params.needId);
      const req = bloodRequests.find((r) => r.id === route.params.needId);
      setSelectedRequestLabel(
        `${req?.bloodGroup || req?.type} - потрібно: ${
          req?.neededAmount || req?.urgency
        }`
      );
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
    console.log('user:', user);
    const donorGroup = user?.bloodType;
    if (!isCompatible(donorGroup, request.bloodGroup)) {
      Alert.alert(
        "Несумісна група крові",
        `Ваша група крові (${donorGroup}) не сумісна з цим запитом (${request.bloodGroup}).\n\n${getCompatibilityDescription(donorGroup)}`,
        [{ text: "Зрозуміло" }]
      );
      return;
    }
    setSelectedRequest(request.id);
    setSelectedRequestLabel(
      `${request.bloodGroup || request.type} - потрібно: ${
        request.neededAmount || request.urgency
      }`
    );
    setShowRequestPicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedCenter || !selectedRequest || !selectedTime) {
      Alert.alert("Помилка", "Оберіть центр, запит та час.");
      return;
    }

    const q = query(
      collection(db, "donationRequests"),
      where("donorId", "==", user?.uid),
      where("status", "in", ["done", "completed"])
    );
    const snapshot = await getDocs(q);
    let lastDonationDate = null;
    snapshot.forEach(doc => {
      const d = doc.data();
      if (!lastDonationDate || new Date(d.date) > new Date(lastDonationDate)) {
        lastDonationDate = d.date;
      }
    });

    let nextPossibleDate = null;
    if (lastDonationDate) {
      nextPossibleDate = new Date(lastDonationDate);
      nextPossibleDate.setMonth(nextPossibleDate.getMonth() + 3);
      nextPossibleDate.setHours(0,0,0,0);
    }

    const selectedDonationDate = new Date(date);
    selectedDonationDate.setHours(0,0,0,0);

    if (nextPossibleDate && selectedDonationDate < nextPossibleDate) {
      Alert.alert(
        "Занадто рано",
        `Ви зможете здати кров не раніше ${formatDate(nextPossibleDate)}.`
      );
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
            onPress: () => setShowInstructionModal(true),
          },
        ]
      );
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Помилка", "Не вдалося записатися на донацію.");
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    const fetchNextPossibleDate = async () => {
      const q = query(
        collection(db, "donationRequests"),
        where("donorId", "==", user?.uid),
        where("status", "in", ["done", "completed"])
      );
      const snapshot = await getDocs(q);
      let lastDonationDate = null;
      snapshot.forEach(doc => {
        const d = doc.data();
        if (!lastDonationDate || new Date(d.date) > new Date(lastDonationDate)) {
          lastDonationDate = d.date;
        }
      });
      let minDate = new Date();
      if (lastDonationDate) {
        minDate = new Date(lastDonationDate);
        minDate.setMonth(minDate.getMonth() + 3);
      }
      setNextPossibleDate(minDate);
      setTempDate(minDate);
    };
    if (showDatePicker) {
      fetchNextPossibleDate();
    }
  }, [showDatePicker]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Планування донації</Text>
          <Text style={styles.subHeader}>Оберіть зручний час та місце</Text>
        </View>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Медичний центр:</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCenterPicker(true)}
            >
              <Text style={styles.selectButtonText}>{selectedCenterName}</Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={Colors.inactiveDark}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Запит на кров:</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() =>
                selectedCenter
                  ? setShowRequestPicker(true)
                  : Alert.alert("Оберіть центр спочатку")
              }
              disabled={!selectedCenter || loadingRequests}
            >
              <Text style={styles.selectButtonText}>
                {loadingRequests ? "Завантаження..." : selectedRequestLabel}
              </Text>
              <Ionicons name="water" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Дата донації:</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectButtonText}>{formatDate(date)}</Text>
              <Ionicons name="calendar" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <View style={styles.inlineDatePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={nextPossibleDate}
                maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
                style={styles.inlineDatePicker}
              />
              <View style={styles.datePickerButtonsContainer}>
                <TouchableOpacity
                  style={styles.datePickerCancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerCancelText}>Скасувати</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerConfirmButton}
                  onPress={() => {
                    setDate(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.datePickerConfirmText}>Підтвердити</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Час:</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowTimePicker(true)}
              disabled={availableTimes.length === 0}
            >
              <Text style={styles.selectButtonText}>
                {selectedTime || "Оберіть час"}
              </Text>
              <Ionicons name="time" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Ionicons
              name="information-circle"
              size={24}
              color={Colors.accent500}
            />
            <Text style={styles.infoText}>
              Після підтвердження запису, деталі вашого візиту будуть на головному екрані. Не забудьте взяти з собою паспорт та підготуватись
              до процедури.
            </Text>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Підтвердити запис</Text>
          </TouchableOpacity>
        </View>

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
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedCenter === center.id &&
                          styles.selectedModalItemText,
                      ]}
                    >
                      {center.nameCenter || center.name}
                    </Text>
                    {selectedCenter === center.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.accent500}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
              
              <View style={styles.compatibilityInfoContainer}>
                <View style={styles.compatibilityHeader}>
                  <Ionicons name="information-circle" size={20} color={Colors.accent500} />
                  <Text style={styles.compatibilityTitle}>
                    Ваша група крові: {user?.bloodType}
                  </Text>
                </View>
                <Text style={styles.compatibilityDescription}>
                  {getCompatibilityDescription(user?.bloodType)}
                </Text>
              </View>

              <ScrollView style={styles.modalScroll}>
                {bloodRequests.length === 0 && (
                  <View style={styles.noRequestsContainer}>
                    <Text style={styles.noRequestsText}>
                      Немає сумісних запитів для вашої групи крові ({user?.bloodType})
                    </Text>
                    <Text style={styles.noRequestsSubtext}>
                      Показуються тільки запити, сумісні з вашою групою крові
                    </Text>
                  </View>
                )}
                {bloodRequests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.modalItem}
                    onPress={() => handleRequestSelect(request)}
                  >
                    <View style={styles.requestInfo}>
                      <Text
                        style={[
                          styles.modalItemText,
                          selectedRequest === request.id &&
                            styles.selectedModalItemText,
                        ]}
                      >
                        {request.bloodGroup || request.type} - потрібно:{" "}
                        {request.neededAmount || request.urgency}
                      </Text>
                      <Text style={styles.compatibilityStatus}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} /> Сумісна група
                      </Text>
                    </View>
                    {selectedRequest === request.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={Colors.accent500}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
                  <Text style={{ textAlign: "center", marginTop: 20 }}>
                    Немає доступних годин
                  </Text>
                )}
                {availableTimes.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeItem,
                      selectedTime === time && styles.selectedTimeItem,
                    ]}
                    onPress={() => {
                      setSelectedTime(time);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.timeItemText,
                        selectedTime === time && styles.selectedTimeItemText,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
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
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={require("../assets/images/donor_instructons.png")}
                style={{
                  width: "100%",
                  height: undefined,
                  aspectRatio: 0.7,
                  resizeMode: "contain",
                }}
              />
            </ScrollView>
            <View
              style={{
                position: "absolute",
                top: 40,
                right: 20,
                flexDirection: "row",
              }}
            >
              <TouchableOpacity
                onPress={async () => {
                  const asset = require("../assets/images/donor_instructons.png");
                  const fileUri =
                    FileSystem.documentDirectory + "donor_instructons.png";
                  await FileSystem.copyAsync({
                    from: asset,
                    to: fileUri,
                  });
                  await MediaLibrary.saveToLibraryAsync(fileUri);
                  Alert.alert(
                    "Збережено",
                    "Зображення збережено у вашій галереї."
                  );
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
  inlineDatePickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey200,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  inlineDatePicker: {
    height: 150,
    marginBottom: 10,
  },
  datePickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.grey200,
    paddingTop: 10,
    margin: 12,
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: Colors.grey100,
  },
  datePickerCancelText: {
    color: Colors.textDark,
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
  },
  datePickerConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: Colors.accent500,
  },
  datePickerConfirmText: {
    color: Colors.white,
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
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
    marginTop: 16,
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
  noRequestsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noRequestsText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  noRequestsSubtext: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  compatibilityInfoContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  compatibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compatibilityTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.textDark,
    marginLeft: 8,
  },
  compatibilityDescription: {
    fontFamily: "e-Ukraine-R",
    fontSize: 14,
    color: Colors.textDark,
    lineHeight: 20,
  },
  requestInfo: {
    flex: 1,
  },
  compatibilityStatus: {
    fontFamily: "e-Ukraine-L",
    fontSize: 12,
    color: Colors.success,
    marginTop: 4,
  },
});
