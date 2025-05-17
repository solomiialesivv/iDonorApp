import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  updateEmail, 
  sendEmailVerification, 
  reauthenticateWithCredential,
  EmailAuthProvider 
} from 'firebase/auth';
import { auth, db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Colors from '../../constants/Colors';

const ProfileEditModal = ({ visible, onClose, userData }) => {
  const [userName, setUserName] = useState(userData?.userName || '');
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone || '');
  const [bloodType, setBloodType] = useState(userData?.bloodType || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(userData?.notificationEnabled ?? true);
  
  const bloodTypes = ['1+', '1-', '2+', '2-', '3+', '3-', '4+', '4-'];

  // Reset state when modal opens with new user data
  useEffect(() => {
    if (visible && userData) {
      setUserName(userData.userName || '');
      setPhoneNumber(userData.phone || '');
      setBloodType(userData.bloodType || '');
      setEmail(userData.email || '');
      setShowEmailConfirmation(false);
      setPassword('');
      setEmailChanged(false);
      setNotificationsEnabled(userData.notificationEnabled ?? true);
    }
  }, [visible, userData]);

  // Check if email was changed
  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailChanged(text !== userData?.email);
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email change with re-authentication
  const handleEmailUpdate = async () => {
    if (!password) {
      Alert.alert('Помилка', 'Будь ласка, введіть пароль для підтвердження зміни електронної пошти');
      return false;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      
      // Create credential with current email and password
      const credential = EmailAuthProvider.credential(
        userData.email,
        password
      );
      
      // Re-authenticate the user
      await reauthenticateWithCredential(user, credential);
      
      // Update the email
      await updateEmail(user, email);
      
      // Send verification email to the new address
      await sendEmailVerification(user);
      
      // Update the email in Firestore as well
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        email: email,
        emailVerified: false
      });
      
      Alert.alert(
        'Електронна пошта змінена',
        'На вашу нову електронну пошту надіслано лист для підтвердження. Будь ласка, перевірте вашу пошту та підтвердіть новий email.'
      );
      
      setShowEmailConfirmation(false);
      return true;
    } catch (error) {
      console.error('Error updating email:', error);
      let errorMessage = 'Не вдалося оновити електронну пошту. Спробуйте пізніше.';
      
      // Handle common errors
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Невірний пароль. Будь ласка, перевірте і спробуйте знову.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Ця електронна пошта вже використовується іншим користувачем.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Будь ласка, вийдіть з додатку і увійдіть знову для зміни електронної пошти.';
      } else if (error.code === 'auth/operation-not-allowed') {
        // Специфічна обробка помилки верифікації
        errorMessage = 'Необхідно спочатку підтвердити вашу поточну електронну пошту. Перевірте ваш поштовий ящик або запитайте новий лист для підтвердження.';
        
        // Додайте опцію надсилання листа для верифікації поточної пошти
        Alert.alert(
          'Необхідна верифікація',
          'Перш ніж змінити електронну пошту, необхідно підтвердити вашу поточну адресу. Бажаєте отримати новий лист для підтвердження?',
          [
            {
              text: 'Ні',
              style: 'cancel'
            },
            {
              text: 'Так, надіслати',
              onPress: async () => {
                try {
                  await sendEmailVerification(auth.currentUser);
                  Alert.alert('Успіх', 'Лист для підтвердження надіслано на вашу поточну електронну пошту.');
                } catch (verificationError) {
                  console.error('Error sending verification email:', verificationError);
                  Alert.alert('Помилка', 'Не вдалося надіслати лист для підтвердження. Спробуйте пізніше.');
                }
              }
            }
          ]
        );
        return false;
      }
      
      Alert.alert('Помилка', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Save all profile changes
  const saveChanges = async () => {
    if (!userName.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть ваше ім\'я');
      return;
    }

    if (emailChanged) {
      if (!isValidEmail(email)) {
        Alert.alert('Помилка', 'Будь ласка, введіть коректну електронну пошту');
        return;
      }
      setShowEmailConfirmation(true);
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        userName: userName,
        phone: phoneNumber,
        bloodType: bloodType,
        notificationEnabled: notificationsEnabled
      });
      
      Alert.alert('Успіх', 'Інформацію профілю оновлено успішно');
      onClose(true); // Передаємо true, щоб вказати, що дані були оновлені
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Помилка', 'Не вдалося оновити профіль. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  // Handle combined flow for profile and email updates
  const handleSaveWithEmailConfirmation = async () => {
    // First update email if changed
    if (emailChanged) {
      const emailUpdated = await handleEmailUpdate();
      if (!emailUpdated) return;
    }
    
    // Then update other profile fields
    saveChanges();
  };

  // Render email confirmation dialog
  const renderEmailConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <Text style={styles.confirmationTitle}>Підтвердіть зміну електронної пошти</Text>
      <Text style={styles.confirmationText}>
        Для зміни електронної пошти потрібно підтвердити ваш пароль. Після зміни на нову адресу буде надіслано лист для підтвердження.
      </Text>
      
      <TextInput
        style={styles.passwordInput}
        value={password}
        onChangeText={setPassword}
        placeholder="Введіть пароль"
        placeholderTextColor={Colors.inactiveDark}
        secureTextEntry={true}
      />
      
      <View style={styles.confirmationButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowEmailConfirmation(false)}
        >
          <Text style={styles.cancelButtonText}>Скасувати</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleSaveWithEmailConfirmation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Підтвердити</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => {
        if (!showEmailConfirmation) {
          Keyboard.dismiss();
          onClose();
        }
      }}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View style={styles.modalView}>
              {showEmailConfirmation ? (
                renderEmailConfirmation()
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Редагувати профіль</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Ionicons name="close" size={24} color={Colors.textDark} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Ім'я</Text>
                    <TextInput
                      style={styles.input}
                      value={userName}
                      onChangeText={setUserName}
                      placeholder="Введіть ваше ім'я"
                      placeholderTextColor={Colors.inactiveDark}
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Електронна пошта</Text>
                    <TextInput
                      style={[
                        styles.input, 
                        emailChanged && styles.changedInput
                      ]}
                      value={email}
                      onChangeText={handleEmailChange}
                      placeholder="Введіть вашу електронну пошту"
                      placeholderTextColor={Colors.inactiveDark}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {emailChanged && (
                      <Text style={styles.changedEmailNote}>
                        Для зміни електронної пошти потрібне підтвердження
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Телефон</Text>
                    <TextInput
                      style={styles.input}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Введіть ваш телефон"
                      placeholderTextColor={Colors.inactiveDark}
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Група крові</Text>
                    <View style={styles.bloodTypesContainer}>
                      {bloodTypes.map(type => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.bloodTypeButton,
                            bloodType === type && styles.bloodTypeButtonSelected
                          ]}
                          onPress={() => setBloodType(type)}
                        >
                          <Text 
                            style={[
                              styles.bloodTypeText,
                              bloodType === type && styles.bloodTypeTextSelected
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Сповіщення</Text>
                    <View style={styles.notificationContainer}>
                      <Text style={styles.notificationText}>
                        Отримувати сповіщення про термінові потреби в крові
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          notificationsEnabled && styles.toggleButtonActive
                        ]}
                        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                      >
                        <View style={[
                          styles.toggleCircle,
                          notificationsEnabled && styles.toggleCircleActive
                        ]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveChanges}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.saveButtonText}>Зберегти зміни</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey200
  },
  modalTitle: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 18,
    color: Colors.textDark
  },
  closeButton: {
    padding: 5
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: 'e-Ukraine-L',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.grey100
  },
  changedInput: {
    borderColor: Colors.accent500,
    backgroundColor: Colors.primaryLight
  },
  changedEmailNote: {
    fontFamily: 'e-Ukraine-L',
    fontSize: 12,
    color: Colors.accent500,
    marginTop: 4
  },
  bloodTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  bloodTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.white,
    marginRight: 8,
    marginBottom: 8
  },
  bloodTypeButtonSelected: {
    backgroundColor: Colors.accent500,
    borderColor: Colors.accent500
  },
  bloodTypeText: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 14,
    color: Colors.textDark
  },
  bloodTypeTextSelected: {
    color: Colors.white
  },
  saveButton: {
    backgroundColor: Colors.accent500,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10
  },
  saveButtonText: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 16,
    color: Colors.white
  },
  // Email Confirmation Styles
  confirmationContainer: {
    padding: 10
  },
  confirmationTitle: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 18,
    color: Colors.textDark,
    marginBottom: 10,
    textAlign: 'center'
  },
  confirmationText: {
    fontFamily: 'e-Ukraine-L',
    fontSize: 12,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: 'e-Ukraine-L',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.grey100,
    marginBottom: 20
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  confirmButton: {
    backgroundColor: Colors.accent500,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center'
  },
  confirmButtonText: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 12,
    color: Colors.white
  },
  cancelButton: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    flex: 1,
    marginRight: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 12,
    color: Colors.textDark
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.grey100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  notificationText: {
    fontFamily: 'e-Ukraine-L',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.grey300,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent500,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    transform: [{ translateX: 22 }],
  },
});

export default ProfileEditModal;