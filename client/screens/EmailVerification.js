import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getAuth, sendEmailVerification } from "firebase/auth";
import { doc, updateDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase/firebase';

const auth = getAuth();

const EmailVerification = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [checking, setChecking] = useState(false);

  const user = auth.currentUser;

  console.log("Current user:", user);
  console.log("sendEmailVerification:", typeof user.sendEmailVerification);
  console.log(navigation.getState());

  useEffect(() => {
    if (user && !user.emailVerified) {
      sendVerificationEmail();
    }
  }, []);

  const sendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Помилка', 'Користувач не авторизований.');
      return;
    }
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setEmailSent(true);
      Alert.alert('Лист надіслано', `Ми надіслали лист для підтвердження на ${user.email}. Перевірте вашу пошту.`);
    } catch (error) {
      console.log("Email verification error:", error);
      Alert.alert('Помилка', 'Не вдалося надіслати лист для підтвердження.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    setChecking(true);
    const currentUser = auth.currentUser;
    await currentUser.reload();
    if (currentUser.emailVerified) {
      await updateDoc(doc(db, 'users', currentUser.uid), { emailVerified: true });
      Alert.alert('Успіх', 'Email підтверджено!');
      navigation.replace('Authenticated');
    } else {
      Alert.alert('Не підтверджено', 'Будь ласка, підтвердіть email за посиланням у листі.');
    }
    setChecking(false);
  };

  return (
    <View style={styles.container}>
      <Ionicons name="mail" size={64} color={Colors.accent500} style={{ marginBottom: 24 }} />
      <Text style={styles.title}>Підтвердження Email</Text>
      <Text style={styles.text}>
        Ми надіслали лист для підтвердження на вашу електронну адресу:
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.text}>
        Перейдіть за посиланням у листі, щоб підтвердити email.
      </Text>
      <TouchableOpacity style={styles.button} onPress={sendVerificationEmail} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Надсилання...' : 'Надіслати ще раз'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={checkVerification} disabled={checking}>
        <Text style={styles.buttonText}>{checking ? 'Перевірка...' : 'Я підтвердив email'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.backButton}
        onPress={async () => {
          await auth.signOut();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }}
      >
        <Text style={styles.backButtonText}>Повернутись назад</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#f5f5f5' 
  },
  title: { 
    fontSize: 22, 
    fontFamily: 'e-Ukraine-M', 
    color: Colors.primary500,
    marginBottom: 16, 
    textAlign: 'center' 
  },
  text: { 
    fontSize: 16, 
    color: Colors.text, 
    fontFamily: 'e-Ukraine-L', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  email: { 
    fontSize: 16, 
    color: Colors.accent500, 
    fontFamily: 'e-Ukraine-M', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  button: { 
    backgroundColor: Colors.accent500, 
    borderRadius: 8, 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    marginTop: 16 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontFamily: 'e-Ukraine-M' 
  },
  backButton: { 
    backgroundColor: Colors.background, 
    borderRadius: 8, 
    paddingVertical: 14, 
    paddingHorizontal: 32, 
    marginTop: 16 
  },
  backButtonText: { 
    color: Colors.primary500, 
    fontSize: 16, 
    fontFamily: 'e-Ukraine-M' 
  },
});

export default EmailVerification;