import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ActionButton from "./ActionButton";
import Colors from "../../constants/Colors";
import PrimaryButton from "./PrimaryButton";

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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{item.medicalCenter}</Text>
      <Text style={styles.bloodGroup}>Група крові: {item.bloodGroup}</Text>
      <Text>Потрібно: {item.neededAmount} л</Text>
      <Text>Зібрано: {item.collectedAmount} л</Text>
      <Text>Дата запиту: {requestDate}</Text>
      <Text style={styles.status}>Статус: {item.status}</Text>
      <PrimaryButton>Запланувати донацію</PrimaryButton>
      <ActionButton>
        Переглянути маршрут
      </ActionButton>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary500,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bloodGroup: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.red,
    marginBottom: 4,
  },
  status: {
    fontWeight: "bold",
    color: Colors.accent500,
    marginTop: 4,
  },
});

export default NeedCard;