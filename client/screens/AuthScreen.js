import React, { useEffect, useState } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import Colors from "../constants/Colors";
import PrimaryButton from "../components/ui/PrimaryButton";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import ForgotPasswordModal from "../components/ui/ForgotPasswordModal";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { useNavigation } from "@react-navigation/native";

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false)
  const navigation = useNavigation();

  useEffect(() => {
    if (auth.currentUser) {
      navigation.replace("Authenticated");
    }
  }, []);

  const validateInputs = () => {
    if (!email || !password) {
      Alert.alert("Помилка", "Будь ласка, введіть email та пароль.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Помилка", "Невірний формат email.");
      return false;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Помилка",
        "Пароль має містити хоча б одну велику літеру, одну цифру та бути не менше 6 символів."
      );
      return false;
    }

    if (!isLogin) {
      if (!userName || !phone || !bloodType || !birthDate) {
        Alert.alert("Помилка", "Будь ласка, заповніть всі поля.");
        return false;
      }

      const phoneRegex = /^\+?3?8?(0\d{9})$/;
      if (!phoneRegex.test(phone)) {
        Alert.alert(
          "Помилка",
          "Невірний формат номера телефону. Використовуйте український формат (380XXXXXXXXX або 0XXXXXXXXX)."
        );
        return false;
      }

      const bloodTypeRegex = /^(1|2|3|4)[+-]$/;
      if (!bloodTypeRegex.test(bloodType)) {
        Alert.alert(
          "Помилка",
          "Група крові має бути від 1 до 4 з '+' або '-'."
        );
        return false;
      }

      const isValidDate = /^(\d{2})[.,](\d{2})[.,](\d{4})$/.test(birthDate);
      if (!isValidDate) {
        Alert.alert(
          "Помилка",
          "Невірний формат дати народження. Використовуйте ДД.ММ.РРРР або ДД,ММ,РРРР"
        );
        return false;
      }
    }

    return true;
  };

  const fetchUserData = async (userId) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      console.log(userData);
    } else {
      console.log("No such document!");
    }
  };

  const handleAuthentication = async () => {
    try {
      if (!validateInputs()) return;

      let userCredential;

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        fetchUserData(userCredential.user.uid);
        navigation.replace("Authenticated");
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;
        await setDoc(doc(db, "users", userId), {
          userName,
          phone,
          bloodType,
          birthDate,
          email,
        });
        fetchUserData(userId);
        navigation.replace("Authenticated");
      }
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          Alert.alert("Помилка", "Ця електронна пошта вже використовується.");
          break;
        case "auth/invalid-email":
          Alert.alert("Помилка", "Невірний формат email.");
          break;
        case "auth/user-not-found":
          Alert.alert("Помилка", "Користувача не знайдено.");
          break;
        case "auth/wrong-password":
          Alert.alert("Помилка", "Невірний пароль.");
          break;
        default:
          Alert.alert("Помилка", error.message);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.screen}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.authContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={require("../assets/images/iDonor_appLogo.png")}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>{isLogin ? "Вхід" : "Реєстрація"}</Text>
            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  value={userName}
                  onChangeText={setUserName}
                  placeholder="Ім'я"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Номер телефону"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.input}
                  value={bloodType}
                  onChangeText={setBloodType}
                  placeholder="Група крові (1-4 з Rh + чи -)"
                  returnKeyType="next"
                />
                <TextInput
                  style={styles.input}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="Дата народження (ДД.ММ.РРРР)"
                  keyboardType="numeric"
                  returnKeyType="next"
                />
              </>
            )}
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Пароль"
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
              >
                <Ionicons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {isLogin && (
              <View style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText} onPress={()=>setModalVisible(true)}>Забули пароль?</Text>
              </View>
            )}
            <PrimaryButton onPress={handleAuthentication}>
              {isLogin ? "Увійти" : "Зареєструватися"}
            </PrimaryButton>
            <View style={styles.bottomContainer}>
              <Text style={styles.toggleText}>
                {isLogin ? "Ще не маєте акаунту?" : "Вже маєте акаунт?"}
              </Text>
              <Text
                style={styles.toggleButton}
                onPress={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Зареєструйтесь" : "Увійдіть"}
              </Text>
            </View>
          </View>
        </ScrollView>
        <ForgotPasswordModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authContainer: {
    width: "96%",
    maxWidth: 400,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    alignSelf: "center",
  },
  imageContainer: {
    marginTop: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
    color: Colors.primary500,
    fontFamily: "e-Ukraine-M",
  },
  input: {
    height: 40,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
    width: "100%",
  },
  toggleText: {
    color: Colors.primary500,
    textAlign: "center",
    padding: 2,
    fontFamily: "e-Ukraine-L",
  },
  toggleButton: {
    color: Colors.accent500,
    textAlign: "center",
    padding: 4,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.toggleColor,
  },
  bottomContainer: {
    marginTop: 14,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 40,
  },
});
