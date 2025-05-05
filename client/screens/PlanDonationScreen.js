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
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import Colors from "../constants/Colors";

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
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [showCenterPicker, setShowCenterPicker] = useState(false);
  const [showRequestPicker, setShowRequestPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const db = getFirestore();

  const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];

  // Sample blood requests for demo purposes
  const sampleBloodRequests = [
    { id: "req1", type: "A+", urgency: "Терміново" },
    { id: "req2", type: "O-", urgency: "Високий" },
    { id: "req3", type: "B+", urgency: "Стандарт" },
    { id: "req4", type: "AB+", urgency: "Стандарт" },
    { id: "req5", type: "A-", urgency: "Терміново" },
  ];

  // Sample medical centers for demo purposes
  const sampleMedicalCenters = [
    { id: "center1", name: "Обласна клінічна лікарня" },
    { id: "center2", name: "Центр крові та трансфузіології" },
    { id: "center3", name: "Міська лікарня №3" },
    { id: "center4", name: "Військовий шпиталь" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Attempt to fetch from Firebase
        const centersSnapshot = await getDocs(collection(db, "medicalCenters"));
        const centers = centersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().nameCenter || "Невідомий центр",
        }));
        
        // If no centers found, use sample data
        if (centers.length === 0) {
          setMedicalCenters(sampleMedicalCenters);
        } else {
          setMedicalCenters(centers);
        }

        const requestsSnapshot = await getDocs(collection(db, "bloodRequests"));
        const requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: doc.data().bloodType || "Невідомий тип",
          urgency: doc.data().urgency || "Стандарт",
        }));
        
        // If no requests found, use sample data
        if (requests.length === 0) {
          setBloodRequests(sampleBloodRequests);
        } else {
          setBloodRequests(requests);
        }
      } catch (error) {
        console.log("Error fetching data:", error);
        // Fallback to sample data if Firebase fetch fails
        setMedicalCenters(sampleMedicalCenters);
        setBloodRequests(sampleBloodRequests);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedCenter || !selectedRequest) {
      Alert.alert("Помилка", "Оберіть центр та запит на кров.");
      return;
    }

    try {
      await addDoc(collection(db, "donationRequests"), {
        donorId: "user123", // TODO: Replace with real authenticated user ID
        centerId: selectedCenter,
        date: date.toISOString().split("T")[0], // YYYY-MM-DD format
        time: selectedTime,
        bloodRequestId: selectedRequest,
        status: "pending",
      });

      Alert.alert("Успіх", "Ваш запит на донацію створено!");
    } catch (error) {
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

          {/* Дата */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Дата донації:</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => {
                // Check platform and show appropriate date picker
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
            >
              <Text style={styles.selectButtonText}>{selectedTime}</Text>
              <Ionicons name="time" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          </View>

          {/* Запит на кров */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Запит на кров:</Text>
            <TouchableOpacity 
              style={styles.selectButton}
              onPress={() => setShowRequestPicker(true)}
            >
              <Text style={styles.selectButtonText}>{selectedRequestLabel}</Text>
              <Ionicons name="water" size={20} color={Colors.inactiveDark} />
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
                    onPress={() => {
                      setSelectedCenter(center.id);
                      setSelectedCenterName(center.name);
                      setShowCenterPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedCenter === center.id && styles.selectedModalItemText
                    ]}>
                      {center.name}
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
                {bloodRequests.map((request) => (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedRequest(request.id);
                      setSelectedRequestLabel(`${request.type} - ${request.urgency}`);
                      setShowRequestPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedRequest === request.id && styles.selectedModalItemText
                    ]}>
                      {request.type} - {request.urgency}
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
    marginBottom: 8,
  },
  subHeader: {
    fontFamily: "e-Ukraine-L",
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -20,
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

//////////////////
// import React, { useEffect, useState } from "react";
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   Alert, 
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   Modal
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
// import Colors from "../constants/Colors";

// export default function PlanDonationScreen() {
//   const [medicalCenters, setMedicalCenters] = useState([]);
//   const [bloodRequests, setBloodRequests] = useState([]);
//   const [selectedCenter, setSelectedCenter] = useState(null);
//   const [selectedCenterName, setSelectedCenterName] = useState("Оберіть центр");
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [selectedRequestLabel, setSelectedRequestLabel] = useState("Оберіть запит");
//   const [date, setDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [selectedTime, setSelectedTime] = useState("09:00");
//   const [showCenterPicker, setShowCenterPicker] = useState(false);
//   const [showRequestPicker, setShowRequestPicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);

//   const db = getFirestore();

//   const availableTimes = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const centersSnapshot = await getDocs(collection(db, "medicalCenters"));
//         const centers = centersSnapshot.docs.map(doc => ({
//           id: doc.id,
//           name: doc.data().nameCenter || "Невідомий центр",
//         }));
//         setMedicalCenters(centers);

//         const requestsSnapshot = await getDocs(collection(db, "bloodRequests"));
//         const requests = requestsSnapshot.docs.map(doc => ({
//           id: doc.id,
//           type: doc.data().bloodType || "Невідомий тип",
//           urgency: doc.data().urgency || "Стандарт",
//         }));
//         setBloodRequests(requests);
//       } catch (error) {
//         Alert.alert("Помилка", "Не вдалося завантажити дані.");
//       }
//     };

//     fetchData();
//   }, []);

//   const handleSubmit = async () => {
//     if (!selectedCenter || !selectedRequest) {
//       Alert.alert("Помилка", "Оберіть центр та запит на кров.");
//       return;
//     }

//     try {
//       await addDoc(collection(db, "donationRequests"), {
//         donorId: "user123", // TODO: Replace with real authenticated user ID
//         centerId: selectedCenter,
//         date: date.toISOString().split("T")[0], // YYYY-MM-DD format
//         time: selectedTime,
//         bloodRequestId: selectedRequest,
//         status: "pending",
//       });

//       Alert.alert("Успіх", "Ваш запит на донацію створено!");
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

//           {/* Дата */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Дата донації:</Text>
//             <TouchableOpacity 
//               style={styles.selectButton}
//               onPress={() => setShowDatePicker(true)}
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
//             >
//               <Text style={styles.selectButtonText}>{selectedTime}</Text>
//               <Ionicons name="time" size={20} color={Colors.inactiveDark} />
//             </TouchableOpacity>
//           </View>

//           {/* Запит на кров */}
//           <View style={styles.formGroup}>
//             <Text style={styles.label}>Запит на кров:</Text>
//             <TouchableOpacity 
//               style={styles.selectButton}
//               onPress={() => setShowRequestPicker(true)}
//             >
//               <Text style={styles.selectButtonText}>{selectedRequestLabel}</Text>
//               <Ionicons name="water" size={20} color={Colors.inactiveDark} />
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

//         {/* Date Picker */}
//         {showDatePicker && (
//           <DateTimePicker
//             value={date}
//             mode="date"
//             display="default"
//             minimumDate={new Date()}
//             maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // +30 days
//             onChange={(event, selectedDate) => {
//               setShowDatePicker(false);
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
//                     onPress={() => {
//                       setSelectedCenter(center.id);
//                       setSelectedCenterName(center.name);
//                       setShowCenterPicker(false);
//                     }}
//                   >
//                     <Text style={[
//                       styles.modalItemText,
//                       selectedCenter === center.id && styles.selectedModalItemText
//                     ]}>
//                       {center.name}
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
//                 {bloodRequests.map((request) => (
//                   <TouchableOpacity
//                     key={request.id}
//                     style={styles.modalItem}
//                     onPress={() => {
//                       setSelectedRequest(request.id);
//                       setSelectedRequestLabel(`${request.type} - ${request.urgency}`);
//                       setShowRequestPicker(false);
//                     }}
//                   >
//                     <Text style={[
//                       styles.modalItemText,
//                       selectedRequest === request.id && styles.selectedModalItemText
//                     ]}>
//                       {request.type} - {request.urgency}
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
//     marginBottom: 14,
//   },
//   subHeader: {
//     fontFamily: "e-Ukraine-L",
//     fontSize: 15,
//     color: Colors.white,
//     opacity: 0.9,
//     marginBottom: 12,
//   },
//   formContainer: {
//     backgroundColor: Colors.white,
//     marginHorizontal: 16,
//     marginTop: -20,
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