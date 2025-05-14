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
  ActivityIndicator,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import Colors from "../constants/Colors";
import PrimaryButton from "../components/ui/PrimaryButton";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import ForgotPasswordModal from "../components/ui/ForgotPasswordModal";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

import BloodTypeSelector from "../components/logic/BloodTypeSelector";

const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (auth.currentUser.emailVerified) {
              navigation.replace("Authenticated");
            } else {
              navigation.replace("EmailVerification");
            }
          } else {
            await auth.signOut();
          }
        } catch (error) {
          console.error("Error checking user status:", error);
        }
      }
    };
    checkAuthStatus();
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
        "Пароль має містити хоча б одну велику літеру(латинську), одну цифру та бути не менше 6 символів."
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

  const handleAuthentication = async () => {
    try {
      if (!validateInputs()) return;
      setLoading(true);
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          if (userCredential.user.emailVerified) {
            navigation.replace("Authenticated");
          } else {
            navigation.replace("EmailVerification");
          }
        } else {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            email: userCredential.user.email,
            emailVerified: userCredential.user.emailVerified,
            createdAt: new Date()
          });
          navigation.replace("EmailVerification");
        }
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userId = userCredential.user.uid;
        let formattedBirthDate = birthDate;
        if (/^(\d{2})[.,](\d{2})[.,](\d{4})$/.test(birthDate)) {
          const [day, month, year] = birthDate.split(/[.,]/);
          formattedBirthDate = `${day}.${month}.${year}`;
        }
        await setDoc(doc(db, "users", userId), {
          userName: userName,
          phone: phone,
          bloodType: bloodType,
          birthDate: formattedBirthDate,
          email: email,
          emailVerified: false,
          createdAt: new Date(),
          notificationEnabled: true,
          bloodLiters: 0,
          donationAmount: 0,
          lastDonation: null,
          donations: [] 
        });
        navigation.replace("EmailVerification");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      
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
    } finally {
      setLoading(false);
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
                <BloodTypeSelector
                  selectedBloodType={bloodType}
                  setSelectedBloodType={setBloodType}
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
                <Text
                  style={styles.forgotPasswordText}
                  onPress={() => setModalVisible(true)}
                >
                  Забули пароль?
                </Text>
              </View>
            )}
            <PrimaryButton 
              onPress={handleAuthentication}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                isLogin ? "Увійти" : "Зареєструватися"
              )}
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
        <ForgotPasswordModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
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
  }
});