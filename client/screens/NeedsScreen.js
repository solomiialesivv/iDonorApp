import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

import Colors from "../constants/Colors";
import NeedCard from "../components/ui/NeedCard";


const NeedsScreen = () => {
  const [needs, setNeeds] = useState([]);
  const [filteredNeeds, setFilteredNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);

  const db = getFirestore();

  useEffect(() => {
    const fetchNeeds = async () => {
      try {
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

          needsData.push({
            id: docSnap.id,
            medicalCenter: medicalCenterSnap.data().nameCenter || "Невідомий центр",
            phone: medicalCenterSnap.data().phoneCenter || "Немає номера",
            email: medicalCenterSnap.data().email || "Немає email",
            bloodGroup: needData.bloodGroup || "Невідома група",
            neededAmount: needData.neededAmount || 0,
            collectedAmount: needData.collectedAmount || 0,
            requestDate: needData.dateOfRequest || null,
            status: needData.status || "Невідомий статус",
          });
        }

        setNeeds(needsData);
        setFilteredNeeds(needsData);
      } catch (error) {
        Alert.alert("Помилка", "Не вдалося завантажити потреби.");
      } finally {
        setLoading(false);
      }
    };

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

    setFilteredNeeds(updatedNeeds);
  }, [searchQuery, sortOrder, selectedBloodGroup, needs]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Потреби у крові</Text>
      <View style={styles.filterContainer}>
        <Ionicons name="search" size={20} style={styles.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Пошук за назвою центру..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          style={styles.sortButton}
        >
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.bloodGroupContainer}>
        {["1-", "1+", "2-", "2+", "3-", "3+", "4-", "4+"].map((group) => (
          <TouchableOpacity
            key={group}
            style={[
              styles.bloodGroupButton,
              selectedBloodGroup === group && styles.selectedButton,
            ]}
            onPress={() =>
              setSelectedBloodGroup(selectedBloodGroup === group ? null : group)
            }
          >
            <Text
              style={[
                styles.bloodGroupText,
                selectedBloodGroup === group && styles.selectedText,
              ]}
            >
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredNeeds.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.textNoNeeds}>
            На даний момент немає запиту з такими параметрами пошуку!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNeeds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NeedCard item={item} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textNoNeeds: {
    fontFamily: "e-Ukraine-B",
    color: Colors.white,
    fontSize: 16,
    textAlign: "center",
    textTransform: "uppercase",
    backgroundColor: Colors.primary500,
    padding: 12,
    borderRadius: 8,
  },
  header: {
    fontFamily: "e-Ukraine-B",
    textTransform: "uppercase",
    marginTop: 64,
    fontSize: 20,
    color: Colors.accent500,
    textAlign: "left",
    padding: 16,
  },
  filterContainer: {
    margin: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "e-Ukraine-L",
    fontSize: 12,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    marginLeft: 8,
  },
  sortButton: {
    padding: 5,
  },
  bloodGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
    margin: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  bloodGroupButton: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "black",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
  },
  selectedButton: {
    backgroundColor: Colors.accent500,
    borderColor: Colors.accent500,
  },
  bloodGroupText: {
    color: Colors.primary,
    fontFamily: "e-Ukraine-M",
  },
  selectedText: {
    color: Colors.white,
    fontFamily: "e-Ukraine-B",
  },
});

export default NeedsScreen;