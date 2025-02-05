import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import PrimaryButton from "./PrimaryButton";
import Colors from "../../constants/Colors";
import { auth } from "../../firebase/firebase";

const ForgotPasswordModal = ({ visible, onClose }) => {
  const [email, setEmail] = useState("");

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Помилка", "Будь ласка, введіть email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Успіх", "Посилання для скидання пароля надіслано на вашу пошту.");
      onClose();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося надіслати посилання. Перевірте email та спробуйте ще раз.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Відновлення пароля</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Введіть ваш email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <PrimaryButton onPress={handlePasswordReset}>Надіслати</PrimaryButton>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Скасувати</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  input: {
    marginTop: 12,
    width: "100%",
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelText: {
    color: Colors.primary500,
  },
});

export default ForgotPasswordModal;
