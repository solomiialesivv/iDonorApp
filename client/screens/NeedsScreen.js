import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from "react-native";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";

import Colors from "../constants/Colors";
import NeedCard from "../components/ui/NeedCard";

const BLOOD_GROUPS = [
  { id: "1+", label: "1+" },
  { id: "1-", label: "1-" },
  { id: "2+", label: "2+" },
  { id: "2-", label: "2-" },
  { id: "3+", label: "3+" },
  { id: "3-", label: "3-" },
  { id: "4+", label: "4+" },
  { id: "4-", label: "4-" }
];
const NeedsScreen = () => {
  const [needs, setNeeds] = useState([]);
  const [filteredNeeds, setFilteredNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [nextPossibleDate, setNextPossibleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
  const navigation = useNavigation();
  const db = getFirestore();

  // Helper: fetch completed donationRequests for a bloodNeed and sum quantityML
  const getCollectedAmount = async (bloodNeedId) => {
    const donationRequestsSnapshot = await getDocs(collection(db, "donationRequests"));
    let total = 0;
    donationRequestsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if ((data.bloodNeedId === bloodNeedId) && (data.status === "done" || data.status === "completed")) {
        total += Number(data.quantityML) || 0;
      }
    });
    return total;
  };

  const fetchNeeds = async () => {
    try {
      setRefreshing(true);
      const querySnapshot = await getDocs(collection(db, "bloodNeeds"));
      const needsData = [];

      for (const docSnap of querySnapshot.docs) {
        const needData = docSnap.data();
        if (!needData.medicalCenterId?.id) continue;

        const medicalCenterRef = doc(
          db,
          "medicalCenters",
          needData.medicalCenterId.id
        );
        const medicalCenterSnap = await getDoc(medicalCenterRef);

        if (!medicalCenterSnap.exists()) continue;

        // Dynamically calculate collectedAmount
        const collectedAmount = await getCollectedAmount(docSnap.id);

        needsData.push({
          id: docSnap.id,
          medicalCenter: medicalCenterSnap.data().nameCenter || "Невідомий центр",
          phone: medicalCenterSnap.data().phoneCenter || "Немає номера",
          email: medicalCenterSnap.data().email || "Немає email",
          bloodGroup: needData.bloodGroup || "Невідома група",
          neededAmount: needData.neededAmount || 0,
          collectedAmount,
          requestDate: needData.dateOfRequest || null,
          status: needData.status || "Активний",
          medicalCenterId: needData.medicalCenterId.id,
          urgency: needData.urgency || false,
        });
      }

      console.log('Fetched needs:', needsData);
      setNeeds(needsData);
      setFilteredNeeds(needsData);
    } catch (error) {
      console.error("Error fetching needs:", error);
      Alert.alert("Помилка", "Не вдалося завантажити потреби.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
  }, [db]);

  useEffect(() => {
    let updatedNeeds = needs.filter((need) =>
      need.medicalCenter.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedBloodGroup) {
      updatedNeeds = updatedNeeds.filter(
        (need) => need.bloodGroup === selectedBloodGroup
      );
    }
    updatedNeeds.sort((a, b) => {
      const dateA = a.requestDate ? new Date(a.requestDate.seconds * 1000).getTime() : 0;
      const dateB = b.requestDate ? new Date(b.requestDate.seconds * 1000).getTime() : 0;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    // Filter out fulfilled needs based on dynamic collectedAmount
    updatedNeeds = updatedNeeds.filter(
      (need) => (need.collectedAmount || 0) < (need.neededAmount || 1)
    );

    // Always show urgent needs first
    const criticalNeeds = updatedNeeds.filter(need => need.urgency === true || need.urgency === "true");
    const nonCriticalNeeds = updatedNeeds.filter(need => !(need.urgency === true || need.urgency === "true"));
    const sortedNeeds = [...criticalNeeds, ...nonCriticalNeeds];

    console.log('Filtered needs:', sortedNeeds);
    setFilteredNeeds(sortedNeeds);
  }, [searchQuery, sortOrder, selectedBloodGroup, needs]);

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

  const handleDonatePress = (item) => {
    navigation.navigate("Планування", { needId: item.id, medicalCenterId: item.medicalCenterId });
  };

  const handleRoutePress = (item) => {
    navigation.navigate("Мапи", { medicalCenterId: item.medicalCenterId });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent500} />
        <Text style={styles.loadingText}>Завантаження потреб...</Text>
      </View>
    );
  }

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="water-outline" size={60} color={Colors.primaryLight} />
      <Text style={styles.emptyText}>
        На даний момент немає запитів з такими параметрами пошуку
      </Text>
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery("");
          setSelectedBloodGroup(null);
        }}
      >
        <Text style={styles.resetButtonText}>Скинути фільтри</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Актуальні потреби у крові</Text>
        <Text style={styles.subHeader}>
          Знайдіть центр, якому потрібна ваша допомога
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.inactiveDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Пошук за назвою центру..."
            placeholderTextColor={Colors.inactiveDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}> 
              <Ionicons name="close-circle" size={20} color={Colors.inactiveDark} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          style={styles.sortButton}
        >
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={22}
            color={Colors.textDark}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Фільтр за групою крові:</Text>
        <View style={styles.bloodGroupsContainer}>
          {BLOOD_GROUPS.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.bloodGroupButton,
                selectedBloodGroup === group.id && styles.selectedBloodGroupButton,
              ]}
              onPress={() =>
                setSelectedBloodGroup(selectedBloodGroup === group.id ? null : group.id)
              }
            >
              <Text
                style={[
                  styles.bloodGroupText,
                  selectedBloodGroup === group.id && styles.selectedBloodGroupText,
                ]}
              >
                {group.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredNeeds.length > 0 
            ? `Знайдено ${filteredNeeds.length} запитів` 
            : "Немає запитів за вашими критеріями"
          }
        </Text>
      </View>
      <FlatList
        data={filteredNeeds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NeedCard 
            item={item} 
            onDonatePress={() => handleDonatePress(item)}
            onRoutePress={() => handleRoutePress(item)}
            isCritical={item.urgency === true}
          />
        )}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          filteredNeeds.length === 0 
            ? { flexGrow: 1 } 
            : { paddingBottom: 20 }
        }
        onRefresh={fetchNeeds}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundAlt,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: "e-Ukraine-L",
    color: Colors.textDark,
    fontSize: 16,
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
    marginBottom: 14,
  },
  subHeader: {
    fontFamily: "e-Ukraine-L",
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.grey200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: Colors.text,
  },
  sortButton: {
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  filterSection: {
    padding: 16,
    marginTop: 8,
  },
  filterTitle: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 12,
  },
  bloodGroupsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bloodGroupButton: {
    width: "11%",  
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.grey300,
    marginHorizontal: 1,
  },
  selectedBloodGroupButton: {
    backgroundColor: Colors.accent500,
    borderColor: Colors.accent500,
  },
  bloodGroupText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.textDark,
  },
  selectedBloodGroupText: {
    color: Colors.white,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.textDark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 16,
    color: Colors.textDark,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: Colors.accent500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  resetButtonText: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.white,
  },
});

export default NeedsScreen;