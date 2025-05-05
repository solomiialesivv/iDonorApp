import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProgressBar } from "react-native-paper";
import Colors from "../../constants/Colors";

const NeedCard = ({ item, onDonatePress, onRoutePress }) => {
  // Логування даних при монтуванні компонента для відладки
  useEffect(() => {
    console.log("Blood Need Full Data:", JSON.stringify(item, null, 2));
  }, [item]);
  
  const requestDate = item.requestDate
    ? new Date(item.requestDate.seconds * 1000).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Невідома дата";

  const progress = item.collectedAmount / item.neededAmount || 0;
  
  // Визначаємо колір прогресу в залежності від відсотка зібраного
  const getProgressColor = () => {
    if (progress < 0.3) return Colors.accent500; // Терміново потрібна кров
    if (progress < 0.7) return Colors.warning;   // Потреба є, але не критична
    return Colors.success;                       // Майже зібрано
  };
  
  // Форматуємо відсоток для відображення
  const progressPercent = Math.round(progress * 100);
  
  // Динамічне визначення терміновості запиту на основі наявних даних
  const determineUrgency = () => {
    // 1. Якщо зібрано менше 20% від потрібної кількості - терміновий
    if (progress < 0.2) return true;
    
    // 2. Рідкісні групи крові мають вищий пріоритет (негативний резус)
    if (item.bloodGroup && 
        (item.bloodGroup.includes("-") || 
         item.bloodGroup === "AB+" || 
         item.bloodGroup === "3+")) return true;
    
    // 3. Якщо запит був створений менше 3 днів тому - теж терміновий
    if (item.requestDate) {
      const requestTime = new Date(item.requestDate.seconds * 1000);
      const now = new Date();
      const daysDifference = (now - requestTime) / (1000 * 60 * 60 * 24);
      if (daysDifference < 3) return true;
    }
    
    return false;
  };
  
  const isUrgent = determineUrgency();

  return (
    <View style={[styles.card, isUrgent && styles.urgentCard]}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{item.medicalCenter}</Text>
          {/* Терміновість замість статусу */}
          <View style={[
            styles.statusBadge, 
            isUrgent ? styles.urgencyBadge : styles.normalBadge
          ]}>
            <Text style={[
              styles.statusText,
              isUrgent && styles.urgencyText
            ]}>
              {isUrgent ? "Терміновий" : "Стандартний"}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.leftColumn}>
          <View style={styles.bloodGroupContainer}>
            <Ionicons name="water" size={24} color={Colors.accent500} />
            <Text style={styles.bloodGroup}>{item.bloodGroup}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textDark} />
            <Text style={styles.infoText}>{requestDate}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.textDark} />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
        </View>
        
        <View style={styles.rightColumn}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              Зібрано: {progressPercent}%
            </Text>
            <Text style={styles.progressDetails}>
              {item.collectedAmount} / {item.neededAmount} мл
            </Text>
            <ProgressBar
              progress={progress}
              color={getProgressColor()}
              style={styles.progressBar}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.donateButton, isUrgent && styles.urgentDonateButton]}
          onPress={onDonatePress}
        >
          <Ionicons 
            name={isUrgent ? "alert-circle" : "heart"} 
            size={18} 
            color={Colors.white} 
          />
          <Text style={styles.donateButtonText}>
            {isUrgent ? "Терміново донатувати" : "Запланувати донацію"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.routeButton}
          onPress={onRoutePress}
        >
          <Ionicons name="navigate" size={18} color={Colors.white} />
          <Text style={styles.routeButtonText}>Маршрут</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    margin: 8,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.grey200,
  },
  urgentCard: {
    borderColor: '#D32F2F',
    borderWidth: 2,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey200,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'e-Ukraine-M',
    color: Colors.textDark,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgencyBadge: {
    backgroundColor: '#FFCDD2', // Світло-червоний фон
  },
  normalBadge: {
    backgroundColor: Colors.primaryLight,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'e-Ukraine-L',
    color: Colors.textDark,
  },
  urgencyText: {
    color: '#D32F2F',
    fontFamily: 'e-Ukraine-M',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  leftColumn: {
    flex: 3,
    marginRight: 16,
  },
  rightColumn: {
    flex: 2,
    justifyContent: 'center',
  },
  bloodGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bloodGroup: {
    fontSize: 16,
    fontFamily: 'e-Ukraine-B',
    color: Colors.accent500,
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'e-Ukraine-L',
    color: Colors.text,
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'e-Ukraine-M',
    marginBottom: 4,
    color: Colors.textDark,
  },
  progressDetails: {
    fontSize: 12,
    fontFamily: 'e-Ukraine-L',
    color: Colors.inactiveDark,
    marginBottom: 4,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.grey200,
  },
  donateButton: {
    flex: 3,
    backgroundColor: Colors.accent500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  urgentDonateButton: {
    backgroundColor: '#D32F2F', // Більш насичений червоний для термінових запитів
  },
  donateButtonText: {
    color: Colors.white,
    fontFamily: 'e-Ukraine-M',
    fontSize: 14,
    marginLeft: 8,
  },
  routeButton: {
    flex: 2,
    backgroundColor: Colors.primary500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  routeButtonText: {
    color: Colors.white,
    fontFamily: 'e-Ukraine-M',
    fontSize: 14,
    marginLeft: 8,
  }
});

export default NeedCard;