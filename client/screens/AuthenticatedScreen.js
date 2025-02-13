import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Button, Alert } from "react-native";
import { auth } from "../firebase/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import Colors from "../constants/Colors";
import StatisticCard from "../components/ui/StatisticCard";
import ActionButton from "../components/ui/ActionButton";
import { Link, useNavigation } from "@react-navigation/native";

const db = getFirestore();

const AuthenticatedScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchUserData = async (userId) => {
    const docRef = doc(db, "users", userId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log(userData);
        setUserData((prevData) => ({
          ...prevData,
          ...userData,
        }));
      } else {
        console.log("No such document!");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserData({
        userName: currentUser.displayName || "Невідомий користувач",
        email: currentUser.email,
        uid: currentUser.uid,
      });

      fetchUserData(currentUser.uid).then(() => setLoading(false));
    } else {
      setLoading(false);
      Alert.alert("Помилка", "Користувач не знайдений.");
    }
  }, []);

  const handleLogout = () => {
    auth
      .signOut()
      .then(() => {
        Alert.alert("Успіх", "Ви вийшли з акаунта.");
        navigation.replace("Auth");
      })
      .catch((error) => {
        Alert.alert("Помилка", error.message);
      });
  };

  if (loading) {
    return (
      <View style={styles.rootContainer}>
        <Text>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <Text style={styles.userName}>Вітаємо, {userData?.userName}!</Text>
      <Text style={styles.mainText}>Хочете задонатити свою кров?</Text>
      <View>
        <Image
          source={require("../assets/images/donate_savelife.png")}
          style={styles.photoContainer}
        />
      </View>
      <View style={[styles.buttonContainer, { marginTop: 14 }]}>
        <Link screen={"Мапи"}>
          <ActionButton style={{borderRadius: 100, backgroundColor: Colors.accent500, maxHeight: 50, fontSize: 20}}>Перейти до медцентрів</ActionButton>
        </Link>
      </View>
      <View style={styles.buttonContainer}>
        <Link screen={"Потреби"} style={styles.halfContainer}>
          <ActionButton>Переглянути потреби</ActionButton>
        </Link>
        <Link screen={"Потреби"} style={styles.halfContainer}>
          <ActionButton style={{ backgroundColor: Colors.primary500 }}>
            Запланувати донацію
          </ActionButton>
        </Link>
      </View>
      <Text style={styles.mainText}>Ваша статистика</Text>
      <View style={styles.buttonContainer}>
        <StatisticCard
          title="К-сть донацій крові"
          imageSource={require("../assets/images/rb_savelife.png")}
          count="8"
        />
        <StatisticCard
          title="К-сть крові в літрах"
          imageSource={require("../assets/images/rb_donations.png")}
          count="3.4"
        />
      </View>
      <View style={styles.logoutButton}>
        <Button
          title="Вийти з облікового запису"
          color="#B80000"
          onPress={handleLogout}
        />
      </View>
    </View>
  );
};

export default AuthenticatedScreen;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: "96%",
    maxWidth: 500,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
    alignSelf: "center",
    justifyContent: "center",
  },
  userName: {
    marginTop: 32,
    fontSize: 18,
    marginBottom: 28,
    color: Colors.text,
    fontFamily: "e-Ukraine-M",
  },
  mainText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.accent500,
    fontFamily: "e-Ukraine-R",
    marginTop: 14,
    marginBottom: 4,
  },
  photoContainer: {
    borderRadius: 4,
    width: "100%",
    height: 120,
    marginTop: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 450,
    maxHeight: 96
  },
  halfContainer: {
    width: "48%",
    maxHeight: 100,
    elevation: 3,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    borderWidth: 0.5,
    borderRadius: 32,
    borderColor: Colors.accent500,
    backgroundColor: Colors.white,
    margin: 32,
  },
  fullWidth: {
    width: "100%",
    alignItems: "center",
  }
});
