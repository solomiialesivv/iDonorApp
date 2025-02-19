import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import Colors from "../../constants/Colors";

const bloodTypes = ["1-", "1+", "2-", "2+", "3-", "3+", "4-", "4+"];

const BloodTypeSelector = ({ selectedBloodType, setSelectedBloodType }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Група крові:</Text>
      <View style={styles.optionsContainer}>
        {bloodTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.option,
              selectedBloodType === type ? styles.selected : null,
            ]}
            onPress={() => setSelectedBloodType(type)}
          >
            <Text
              style={[
                styles.optionText,
                selectedBloodType === type ? styles.selectedText : null,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontFamily: "e-Ukraine-R",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  option: {
    padding: 8,
    margin: 2,
    borderWidth: 1,
    borderColor: Colors.inactiveDark,
    borderRadius: 5,
  },
  selected: {
    backgroundColor: Colors.accent500,
    borderColor: Colors.accent500,
  },
  optionText: {
    fontFamily: "e-Ukraine-R",
    fontSize: 14,
    color: Colors.inactiveDark
  },
  selectedText: {
    color: Colors.white,
  },
});

export default BloodTypeSelector;
