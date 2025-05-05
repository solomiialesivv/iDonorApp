// import React from "react";
// import { View, Text, StyleSheet } from "react-native";
// import Colors from "../../constants/Colors";

// const WorkingHoursTable = ({ workingHours }) => {
//   const daysOfWeek = [
//     "Понеділок",
//     "Вівторок",
//     "Середа",
//     "Четвер",
//     "П'ятниця",
//     "Субота",
//     "Неділя",
//   ];

//   return (
//     <View style={styles.table}>
//       <View style={styles.tableRow}>
//         <Text style={styles.tableHeader}>День</Text>
//         <Text style={styles.tableHeader}>Години роботи</Text>
//       </View>
//       {daysOfWeek.map((day) => (
//         <View key={day} style={styles.tableRow}>
//           <Text style={styles.tableCell}>{day}</Text>
//           <Text style={styles.tableCell}>{workingHours[day.toLowerCase()] || "Немає даних"}</Text>
//         </View>
//       ))}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   table: {
//     borderWidth: 1,
//     borderColor: Colors.primary500,
//     borderRadius: 4,
//     overflow: "hidden",
//     marginTop: 8,
//   },
//   tableRow: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.primary500,
//   },
//   tableHeader: {
//     flex: 1,
//     backgroundColor: Colors.primary500,
//     color: Colors.white,
//     fontFamily: "e-Ukraine-B",
//     padding: 6,
//     textAlign: "left",
//     fontSize: 16,
//   },
//   tableCell: {
//     flex: 1,
//     padding: 6,
//     textAlign: "left",
//     fontSize: 14,
//     color: Colors.accent500,
//   },
// });

// export default WorkingHoursTable;
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const WorkingHoursTable = ({ workingHours }) => {
  const daysOfWeek = [
    { name: "Понеділок", key: "понеділок", icon: "calendar-outline" },
    { name: "Вівторок", key: "вівторок", icon: "calendar-outline" },
    { name: "Середа", key: "середа", icon: "calendar-outline" },
    { name: "Четвер", key: "четвер", icon: "calendar-outline" },
    { name: "П'ятниця", key: "п'ятниця", icon: "calendar-outline" },
    { name: "Субота", key: "субота", icon: "calendar-outline" },
    { name: "Неділя", key: "неділя", icon: "calendar-outline" },
  ];

  // Визначаємо, чи сьогодні робочий день
  const today = new Date().getDay(); // 0 - неділя, 1 - понеділок, ...
  const todayIndex = today === 0 ? 6 : today - 1; // Конвертуємо до нашого масиву

  const isOpen = (hours) => {
    if (!hours || hours.toLowerCase().includes('вихідний')) {
      return false;
    }
    return true;
  };

  return (
    <View style={styles.container}>
      {daysOfWeek.map((day, index) => {
        const hours = workingHours[day.key] || "Немає даних";
        const isToday = index === todayIndex;
        const dayOpen = isOpen(hours);

        return (
          <View 
            key={day.name} 
            style={[
              styles.dayRow, 
              isToday && styles.todayRow,
              index === daysOfWeek.length - 1 ? styles.lastRow : null
            ]}
          >
            <View style={styles.dayNameContainer}>
              <Ionicons 
                name={isToday ? "today-outline" : day.icon} 
                size={16} 
                color={isToday ? Colors.accent500 : Colors.textDark} 
                style={styles.dayIcon}
              />
              <Text style={[
                styles.dayName, 
                isToday && styles.todayText
              ]}>
                {day.name}
              </Text>
            </View>
            
            <View style={styles.hoursContainer}>
              <Text style={[
                styles.hours, 
                !dayOpen && styles.closedText,
                isToday && styles.todayText
              ]}>
                {hours}
              </Text>
              {isToday && dayOpen && (
                <View style={styles.openIndicator}>
                  <View style={styles.openDot}></View>
                  <Text style={styles.openText}>Відкрито</Text>
                </View>
              )}
              {isToday && !dayOpen && (
                <View style={styles.closedIndicator}>
                  <View style={styles.closedDot}></View>
                  <Text style={styles.closedIndicatorText}>Зачинено</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginTop: 8,
  },
  dayRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey200,
    alignItems: "center",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  todayRow: {
    backgroundColor: Colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent500,
  },
  dayNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  dayIcon: {
    marginRight: 8,
  },
  dayName: {
    fontFamily: "e-Ukraine-M",
    fontSize: 14,
    color: Colors.textDark,
  },
  todayText: {
    color: Colors.accent600,
    fontFamily: "e-Ukraine-B",
  },
  hoursContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  hours: {
    fontFamily: "e-Ukraine-L",
    fontSize: 14,
    color: Colors.text,
  },
  closedText: {
    color: Colors.inactiveDark,
    fontStyle: "italic",
  },
  openIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 4,
  },
  openText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 12,
    color: Colors.success,
  },
  closedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  closedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.inactiveDark,
    marginRight: 4,
  },
  closedIndicatorText: {
    fontFamily: "e-Ukraine-L",
    fontSize: 12,
    color: Colors.inactiveDark,
  },
});

export default WorkingHoursTable;
