import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { ProgressBar } from "react-native-paper";
import ActionButton from "./ActionButton";
import PrimaryButton from "./PrimaryButton";
import Colors from "../../constants/Colors";

const NeedCard = ({ item }) => {
  const requestDate = item.requestDate
    ? new Date(item.requestDate.seconds * 1000).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Невідома дата";

  const progress = item.collectedAmount / item.neededAmount || 0; // Запобігаємо NaN

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.medicalCenter}</Text>
      <View style={styles.infoRow}>
        <Icon name="water" size={18} color={Colors.accent500} />
        <Text style={styles.bloodGroup}>Група крові: {item.bloodGroup}</Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="calendar" size={18} color={Colors.inactiveDark} />
        <Text style={styles.date}>Дата запиту: {requestDate}</Text>
      </View>

      <Text style={styles.label}>
        Зібрано: {item.collectedAmount} л / {item.neededAmount} л
      </Text>
      <ProgressBar
        progress={progress}
        color={Colors.primary600}
        style={styles.progressBar}
      />

      <Text style={styles.status}>Статус: {item.status}</Text>

      <PrimaryButton>Запланувати донацію</PrimaryButton>
      <ActionButton>Переглянути маршрут</ActionButton>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    margin: 4,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3, // Android тінь
    shadowColor: "#000", // iOS тінь
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: "#000",
  },
  title: {
    fontSize: 16,
    fontFamily: 'e-Ukraine-M',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bloodGroup: {
    fontSize: 14,
    fontFamily: 'e-Ukraine-B',
    color: Colors.accent500,
    marginLeft: 6,
  },
  date: {
    fontSize: 13,
    fontFamily: 'e-Ukraine-R',
    color: Colors.inactiveDark,
    marginLeft: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: 'e-Ukraine-R',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  status: {
    fontSize: 14,
    fontFamily: 'e-Ukraine-M',
    color: Colors.accent500,
    marginTop: 6,
  },
});

export default NeedCard;