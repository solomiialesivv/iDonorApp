import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { auth, db } from '../firebase/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Colors from '../constants/Colors';
import PrimaryButton from '../components/ui/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Мок-функції для верифікації
const mockSendVerificationCode = async (phoneNumber) => {
  console.log(`[MOCK] Надсилання коду на номер: ${phoneNumber}`);
  // Імітація API запиту
  await new Promise(resolve => setTimeout(resolve, 1500));
  return "mock-verification-id-123";
};

const mockVerifyCode = async (verificationId, code) => {
  console.log(`[MOCK] Перевірка коду: ${code} для ID: ${verificationId}`);
  // Імітація API запиту
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Для тестування, код "223411"
  if (code === "223411") {
    return { user: { uid: "mock-user-id" } };
  }
  throw new Error("Невірний код. Спробуйте ще раз");
};

const PhoneVerification = ({ navigation, route }) => {
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(route.params?.phoneNumber || '');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState(phoneNumber ? 'code' : 'phone');
  const [animation] = useState(new Animated.Value(0));
  const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
  const [error, setError] = useState('');

  // Animation for success checkmark
  useEffect(() => {
    if (isVerified) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }).start();
    }
  }, [isVerified]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if the user already has a verified phone
  useEffect(() => {
    const checkPhoneVerification = async () => {
      if (auth.currentUser) {
        try {
          const userId = auth.currentUser.uid;
          const userDoc = await getDoc(doc(db, 'users', userId));
          
          if (userDoc.exists() && userDoc.data().phoneVerified) {
            navigation.replace('Authenticated');
          } else if (phoneNumber) {
            // If phone number is provided via route params, set up formatted version
            setFormattedPhoneNumber(formatPhoneNumberForDisplay(phoneNumber));
          }
        } catch (error) {
          console.log('Error checking verification status:', error);
        }
      }
    };
    
    checkPhoneVerification();
  }, []);

  // Function to format phone number with Ukrainian format for display
  const formatPhoneNumberForDisplay = (number) => {
    if (!number) return '';
    
    let cleaned = number.replace(/\D/g, '');
    
    if (cleaned.startsWith('380') && cleaned.length >= 12) {
      return `+380 (${cleaned.substring(3, 5)}) ${cleaned.substring(5, 8)}-${cleaned.substring(8, 10)}-${cleaned.substring(10, 12)}`;
    } else if (cleaned.startsWith('38') && cleaned.length >= 11) {
      return `+38 (0${cleaned.substring(2, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
    } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
      return `+380 (${cleaned.substring(1, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`;
    }
    
    return `+${cleaned}`;
  };

  // Function to format phone number with Ukrainian format
  const formatPhoneNumber = (number) => {
    // Remove all non-digit characters
    let cleaned = number.replace(/\D/g, '');

    // Ensure the number starts with Ukrainian country code
    if (!cleaned.startsWith('380') && cleaned.startsWith('0')) {
      cleaned = '38' + cleaned;
    } else if (!cleaned.startsWith('380') && !cleaned.startsWith('0')) {
      cleaned = '380' + cleaned;
    }

    // Limit to valid length
    if (cleaned.length > 12) {
      cleaned = cleaned.substring(0, 12);
    }

    setPhoneNumber(cleaned);
    setFormattedPhoneNumber(formatPhoneNumberForDisplay(cleaned));
    return cleaned;
  };

  const sendVerificationCode = async () => {
    if (countdown > 0) return;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Помилка', 'Будь ласка, введіть дійсний номер телефону.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Format phone number to ensure it has country code
      const formattedNumber = `+${formatPhoneNumber(phoneNumber)}`;
      console.log("Надсилання коду на:", formattedNumber);
      
      // Використовуємо мок-функцію замість реального API
      const verificationId = await mockSendVerificationCode(formattedNumber);
      
      setVerificationId(verificationId);
      
      // Move to code entry step
      setStep('code');
      setCountdown(60);
      Alert.alert(
        'Код надіслано',
        `Ми надіслали код підтвердження на номер ${formatPhoneNumberForDisplay(phoneNumber)}.\n`
      );
    } catch (error) {
      console.error("Помилка надсилання коду:", error);
      setError(error.message);
      Alert.alert('Помилка', `Не вдалося надіслати код. ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Помилка', 'Будь ласка, введіть 6-значний код підтвердження.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Використовуємо мок-функцію замість реального API
      await mockVerifyCode(verificationId, verificationCode);
      
      // Update user's phone verification status in Firestore
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            phoneVerified: true
          });
          console.log("Дані користувача успішно оновлено");
        } catch (updateError) {
          console.error("Помилка оновлення даних користувача:", updateError);
        }
      }
      
      setIsVerified(true);
      
      // After verification, redirect to the main app
      setTimeout(() => {
        navigation.replace('Authenticated');
      }, 2000);
    } catch (error) {
      console.error("Помилка верифікації коду:", error);
      setError(error.message);
      Alert.alert('Помилка', `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = () => {
    if (countdown > 0) return;
    sendVerificationCode();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Auth');
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося вийти з облікового запису: ' + error.message);
    }
  };

  // Render phone number input step
  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.instructionText}>
        Будь ласка, введіть ваш номер телефону для верифікації:
      </Text>
      
      <View style={styles.phoneInputContainer}>
        <Text style={styles.prefix}>+</Text>
        <TextInput
          style={styles.phoneInput}
          value={phoneNumber}
          onChangeText={(text) => formatPhoneNumber(text)}
          placeholder="380XXXXXXXXX"
          keyboardType="phone-pad"
          maxLength={12}
        />
      </View>
      
      {formattedPhoneNumber ? (
        <Text style={styles.formattedPhoneText}>
          {formattedPhoneNumber}
        </Text>
      ) : null}
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.buttonWrapper}>
        <PrimaryButton 
          onPress={sendVerificationCode}
          disabled={loading}
          style={styles.actionButton}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.buttonText}>Надсилання...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Отримати код</Text>
          )}
        </PrimaryButton>
      </View>
    </View>
  );

  // Render verification code input step
  const renderCodeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.instructionText}>
        Введіть код підтвердження, надісланий на номер:
      </Text>
      <Text style={styles.phoneText}>{formattedPhoneNumber || `+${phoneNumber}`}</Text>
      
      <View style={styles.codeInputWrapper}>
        <TextInput
          style={styles.codeInput}
          value={verificationCode}
          onChangeText={setVerificationCode}
          placeholder="• • • • • •"
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <View style={styles.buttonWrapper}>
        <PrimaryButton 
          onPress={verifyCode}
          disabled={loading}
          style={styles.actionButton}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.buttonText}>Перевірка...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Підтвердити</Text>
          )}
        </PrimaryButton>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.resendButton, 
          countdown > 0 && styles.resendButtonDisabled
        ]}
        onPress={resendVerificationCode}
        disabled={countdown > 0 || loading}
      >
        <Text style={styles.resendButtonText}>
          {countdown > 0 
            ? `Надіслати повторно (${countdown}с)` 
            : "Надіслати повторно"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render success message when verified
  const renderVerifiedStep = () => {
    const scale = animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.5, 1.2, 1]
    });
    
    return (
      <View style={styles.verifiedContainer}>
        <Animated.View
          style={{
            transform: [{ scale }]
          }}
        >
          <View style={styles.successIconWrapper}>
            <Ionicons name="checkmark" size={80} color={Colors.white} />
          </View>
        </Animated.View>
        <Text style={styles.verifiedText}>Номер телефону підтверджено!</Text>
        <Text style={styles.redirectText}>Перенаправлення на головну сторінку...</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >      
      <View style={styles.backgroundTop} />
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/iDonor_appLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Підтвердження номера телефону</Text>
        
        {isVerified ? renderVerifiedStep() : (
          step === 'phone' ? renderPhoneStep() : renderCodeStep()
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Вийти з облікового запису</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  backgroundTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: Colors.primary500,
    opacity: 0.1,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  card: {
    backgroundColor: Colors.white,
    width: '96%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  logo: {
    width: 80,
    height: 80
  },
  title: {
    fontSize: 22,
    fontFamily: 'e-Ukraine-M',
    color: Colors.primary500,
    marginBottom: 24,
    textAlign: 'center'
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center'
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.text,
    fontFamily: 'e-Ukraine-L',
    lineHeight: 22
  },
  phoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.accent500,
    fontFamily: 'e-Ukraine-M'
  },
  formattedPhoneText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'e-Ukraine-L'
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'e-Ukraine-L'
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    width: '100%',
    height: 56,
    backgroundColor: '#fafafa'
  },
  prefix: {
    fontSize: 18,
    fontFamily: 'e-Ukraine-M',
    color: Colors.text,
    marginRight: 5
  },
  phoneInput: {
    flex: 1,
    height: 56,
    fontSize: 18,
    fontFamily: 'e-Ukraine-L'
  },
  codeInputWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16
  },
  codeInput: {
    height: 56,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 10,
    width: '80%',
    backgroundColor: '#fafafa',
    fontFamily: 'e-Ukraine-M'
  },
  buttonWrapper: {
    width: '100%',
    marginVertical: 8
  },
  actionButton: {
    height: 54,
    borderRadius: 8
  },
  buttonText: {
    fontFamily: 'e-Ukraine-M',
    fontSize: 16
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 10
  },
  resendButtonDisabled: {
    opacity: 0.6
  },
  resendButtonText: {
    color: Colors.primary500,
    fontSize: 16,
    fontFamily: 'e-Ukraine-L',
    textDecorationLine: 'underline'
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%'
  },
  logoutButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8
  },
  logoutButtonText: {
    color: Colors.accent500,
    fontSize: 16,
    fontFamily: 'e-Ukraine-L'
  },
  verifiedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%'
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  verifiedText: {
    fontSize: 18,
    fontFamily: 'e-Ukraine-M',
    color: Colors.success,
    marginTop: 16,
    marginBottom: 8
  },
  redirectText: {
    fontSize: 14,
    fontFamily: 'e-Ukraine-L',
    color: Colors.gray,
    marginTop: 8
  }
});

export default PhoneVerification;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
//   Animated,
//   Dimensions
// } from 'react-native';
// import { auth, db } from '../firebase/firebase';
// import { doc, updateDoc, getDoc } from 'firebase/firestore';
// import Colors from '../constants/Colors';
// import PrimaryButton from '../components/ui/PrimaryButton';
// import { Ionicons } from '@expo/vector-icons';

// const { width } = Dimensions.get('window');

// // Firebase phone verification functions would go here
// // For now we'll use mock functions
// const mockSendVerificationCode = async (phoneNumber) => {
//   console.log(`Надсилання коду на номер: ${phoneNumber}`);
//   // API request simulation
//   await new Promise(resolve => setTimeout(resolve, 1500));
//   return "mock-verification-id-123";
// };

// const mockVerifyCode = async (verificationId, code) => {
//   console.log(`Перевірка коду: ${code} для ID: ${verificationId}`);
//   // API request simulation
//   await new Promise(resolve => setTimeout(resolve, 1500));
  
//   // For testing, code "123456" is always successful
//   if (code === "123456") {
//     return { user: { uid: "mock-user-id" } };
//   }
//   throw new Error("Невірний код.");
// };

// const PhoneVerification = (props) => {
//   // Get navigation and route from props
//   const { navigation } = props;
//   const route = props.route || {};
//   const params = route.params || {};
  
//   const [verificationId, setVerificationId] = useState('');
//   const [verificationCode, setVerificationCode] = useState('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [isVerified, setIsVerified] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [countdown, setCountdown] = useState(0);
//   const [step, setStep] = useState('phone');
//   const [animation] = useState(new Animated.Value(0));
//   const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
//   const [error, setError] = useState('');

//   // Set up phone number and step from route params (if available)
//   useEffect(() => {
//     if (params.phoneNumber) {
//       setPhoneNumber(params.phoneNumber);
//       setFormattedPhoneNumber(formatPhoneNumberForDisplay(params.phoneNumber));
//       setStep('code');
      
//       // Automatically send verification code after a short delay
//       // but only once when params are initially processed
//       setTimeout(() => {
//         sendVerificationCode();
//       }, 500);
//     }
    
//     if (params.directToCode) {
//       setStep('code');
//     }
//   }, []);

//   // Animation for success checkmark
//   useEffect(() => {
//     if (isVerified) {
//       Animated.timing(animation, {
//         toValue: 1,
//         duration: 600,
//         useNativeDriver: true
//       }).start();
//     }
//   }, [isVerified]);

//   // Countdown timer
//   useEffect(() => {
//     if (countdown > 0) {
//       const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [countdown]);

//   // Check if the user already has a verified phone
//   useEffect(() => {
//     const checkPhoneVerification = async () => {
//       if (auth.currentUser) {
//         try {
//           const userId = auth.currentUser.uid;
//           const userDoc = await getDoc(doc(db, 'users', userId));
          
//           if (userDoc.exists() && userDoc.data().phoneVerified) {
//             // Don't navigate directly - let App.js handle it based on auth state
//             await auth.currentUser.reload();
//           }
//         } catch (error) {
//           console.log('Error checking verification status:', error);
//         }
//       }
//     };
    
//     checkPhoneVerification();
//   }, []);

//   // Function to format phone number with Ukrainian format for display
//   const formatPhoneNumberForDisplay = (number) => {
//     if (!number) return '';
    
//     let cleaned = number.replace(/\D/g, '');
    
//     if (cleaned.startsWith('380') && cleaned.length >= 12) {
//       return `+380 (${cleaned.substring(3, 5)}) ${cleaned.substring(5, 8)}-${cleaned.substring(8, 10)}-${cleaned.substring(10, 12)}`;
//     } else if (cleaned.startsWith('38') && cleaned.length >= 11) {
//       return `+38 (0${cleaned.substring(2, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
//     } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
//       return `+380 (${cleaned.substring(1, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`;
//     }
    
//     return `+${cleaned}`;
//   };

//   // Function to format phone number with Ukrainian format
//   const formatPhoneNumber = (number) => {
//     // Remove all non-digit characters
//     let cleaned = number.replace(/\D/g, '');

//     // Ensure the number starts with Ukrainian country code
//     if (!cleaned.startsWith('380') && cleaned.startsWith('0')) {
//       cleaned = '38' + cleaned;
//     } else if (!cleaned.startsWith('380') && !cleaned.startsWith('0')) {
//       cleaned = '380' + cleaned;
//     }

//     // Limit to valid length
//     if (cleaned.length > 12) {
//       cleaned = cleaned.substring(0, 12);
//     }

//     setPhoneNumber(cleaned);
//     setFormattedPhoneNumber(formatPhoneNumberForDisplay(cleaned));
//     return cleaned;
//   };

//   const sendVerificationCode = async () => {
//     if (countdown > 0) return;
    
//     if (!phoneNumber || phoneNumber.length < 10) {
//       Alert.alert('Помилка', 'Будь ласка, введіть дійсний номер телефону.');
//       return;
//     }

//     setLoading(true);
//     setError('');
    
//     try {
//       // Format phone number to ensure it has country code
//       const formattedNumber = `+${formatPhoneNumber(phoneNumber)}`;
//       console.log("Надсилання коду на:", formattedNumber);
      
//       // Use mock function instead of real API
//       const verificationId = await mockSendVerificationCode(formattedNumber);
      
//       setVerificationId(verificationId);
      
//       // Move to code entry step
//       setStep('code');
//       setCountdown(60);
//       Alert.alert(
//         'Код надіслано',
//         `Ми надіслали код підтвердження на номер ${formatPhoneNumberForDisplay(phoneNumber)}.`
//       );
//     } catch (error) {
//       console.error("Помилка надсилання коду:", error);
//       setError(error.message);
//       Alert.alert('Помилка', `Не вдалося надіслати код. ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyCode = async () => {
//     if (!verificationCode || verificationCode.length !== 6) {
//       Alert.alert('Помилка', 'Будь ласка, введіть 6-значний код підтвердження.');
//       return;
//     }

//     setLoading(true);
//     setError('');
    
//     try {
//       // Use mock function instead of real API
//       await mockVerifyCode(verificationId, verificationCode);
      
//       // Update user's phone verification status in Firestore
//       if (auth.currentUser) {
//         try {
//           await updateDoc(doc(db, 'users', auth.currentUser.uid), {
//             phoneVerified: true
//           });
//           console.log("Дані користувача успішно оновлено");
//         } catch (updateError) {
//           console.error("Помилка оновлення даних користувача:", updateError);
//         }
//       }
      
//       setIsVerified(true);
      
//       // After verification, redirect to the main app by forcing auth state update
//       setTimeout(async () => {
//         try {
//           // Instead of direct navigation, update the user's verification status
//           // This will trigger the auth state change listener in App.js
//           if (auth.currentUser) {
//             await updateDoc(doc(db, 'users', auth.currentUser.uid), {
//               phoneVerified: true
//             });
            
//             // Force refresh the auth state
//             await auth.currentUser.reload();
            
//             // This alert helps with debugging and can be removed in production
//             Alert.alert('Успіх', 'Верифікацію завершено успішно. Перенаправлення...');
//           }
//         } catch (error) {
//           console.error("Error updating verification status:", error);
//           Alert.alert('Помилка', 'Не вдалося оновити статус верифікації.');
//         }
//       }, 2000);
//     } catch (error) {
//       console.error("Помилка верифікації коду:", error);
//       setError(error.message);
//       Alert.alert('Помилка', `${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resendVerificationCode = () => {
//     if (countdown > 0) return;
//     sendVerificationCode();
//   };

//   const handleLogout = async () => {
//     try {
//       await auth.signOut();
//       navigation.replace('Auth');
//     } catch (error) {
//       Alert.alert('Помилка', 'Не вдалося вийти з облікового запису: ' + error.message);
//     }
//   };

//   // Render phone number input step
//   const renderPhoneStep = () => (
//     <View style={styles.stepContainer}>
//       <Text style={styles.instructionText}>
//         Будь ласка, введіть ваш номер телефону для верифікації:
//       </Text>
      
//       <View style={styles.phoneInputContainer}>
//         <Text style={styles.prefix}>+</Text>
//         <TextInput
//           style={styles.phoneInput}
//           value={phoneNumber}
//           onChangeText={(text) => formatPhoneNumber(text)}
//           placeholder="380XXXXXXXXX"
//           keyboardType="phone-pad"
//           maxLength={12}
//         />
//       </View>
      
//       {formattedPhoneNumber ? (
//         <Text style={styles.formattedPhoneText}>
//           {formattedPhoneNumber}
//         </Text>
//       ) : null}
      
//       {error ? (
//         <Text style={styles.errorText}>{error}</Text>
//       ) : null}
      
//       <View style={styles.buttonWrapper}>
//         <PrimaryButton 
//           onPress={sendVerificationCode}
//           disabled={loading}
//           style={styles.actionButton}
//         >
//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator color={Colors.white} size="small" />
//               <Text style={styles.buttonText}>Надсилання...</Text>
//             </View>
//           ) : (
//             <Text style={styles.buttonText}>Отримати код</Text>
//           )}
//         </PrimaryButton>
//       </View>
//     </View>
//   );

//   // Render verification code input step
//   const renderCodeStep = () => (
//     <View style={styles.stepContainer}>
//       <Text style={styles.instructionText}>
//         Введіть код підтвердження, надісланий на номер:
//       </Text>
//       <Text style={styles.phoneText}>{formattedPhoneNumber || `+${phoneNumber}`}</Text>
      
//       <View style={styles.codeInputWrapper}>
//         <TextInput
//           style={styles.codeInput}
//           value={verificationCode}
//           onChangeText={setVerificationCode}
//           placeholder="• • • • • •"
//           keyboardType="number-pad"
//           maxLength={6}
//           autoFocus={true}
//         />
//       </View>
      
//       {error ? (
//         <Text style={styles.errorText}>{error}</Text>
//       ) : null}
      
//       <View style={styles.buttonWrapper}>
//         <PrimaryButton 
//           onPress={verifyCode}
//           disabled={loading}
//           style={styles.actionButton}
//         >
//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator color={Colors.white} size="small" />
//               <Text style={styles.buttonText}>Перевірка...</Text>
//             </View>
//           ) : (
//             <Text style={styles.buttonText}>Підтвердити</Text>
//           )}
//         </PrimaryButton>
//       </View>
      
//       <TouchableOpacity 
//         style={[
//           styles.resendButton, 
//           countdown > 0 && styles.resendButtonDisabled
//         ]}
//         onPress={resendVerificationCode}
//         disabled={countdown > 0 || loading}
//       >
//         <Text style={styles.resendButtonText}>
//           {countdown > 0 
//             ? `Надіслати повторно (${countdown}с)` 
//             : "Надіслати повторно"}
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );

//   // Render success message when verified
//   const renderVerifiedStep = () => {
//     const scale = animation.interpolate({
//       inputRange: [0, 0.5, 1],
//       outputRange: [0.5, 1.2, 1]
//     });
    
//     return (
//       <View style={styles.verifiedContainer}>
//         <Animated.View
//           style={{
//             transform: [{ scale }]
//           }}
//         >
//           <View style={styles.successIconWrapper}>
//             <Ionicons name="checkmark" size={80} color={Colors.white} />
//           </View>
//         </Animated.View>
//         <Text style={styles.verifiedText}>Номер телефону підтверджено!</Text>
//         <Text style={styles.redirectText}>Перенаправлення на головну сторінку...</Text>
//       </View>
//     );
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === "ios" ? "padding" : "height"}
//       style={styles.container}
//     >      
//       <View style={styles.backgroundTop} />
//       <View style={styles.card}>
//         <View style={styles.logoContainer}>
//           <Image
//             source={require('../assets/images/iDonor_appLogo.png')}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//         </View>
        
//         <Text style={styles.title}>Підтвердження номера телефону</Text>
        
//         {isVerified ? renderVerifiedStep() : (
//           step === 'phone' ? renderPhoneStep() : renderCodeStep()
//         )}
        
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity 
//             style={styles.logoutButton}
//             onPress={handleLogout}
//           >
//             <Text style={styles.logoutButtonText}>Вийти з облікового запису</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#f5f5f5'
//   },
//   backgroundTop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 200,
//     backgroundColor: Colors.primary500,
//     opacity: 0.1,
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30
//   },
//   card: {
//     backgroundColor: Colors.white,
//     width: '96%',
//     maxWidth: 420,
//     padding: 24,
//     borderRadius: 16,
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     zIndex: 1
//   },
//   logoContainer: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#f8f8f8',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 8,
//     marginBottom: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4
//   },
//   logo: {
//     width: 80,
//     height: 80
//   },
//   title: {
//     fontSize: 22,
//     fontFamily: 'e-Ukraine-M',
//     color: Colors.primary500,
//     marginBottom: 24,
//     textAlign: 'center'
//   },
//   stepContainer: {
//     width: '100%',
//     alignItems: 'center'
//   },
//   instructionText: {
//     fontSize: 16,
//     marginBottom: 16,
//     textAlign: 'center',
//     color: Colors.text,
//     fontFamily: 'e-Ukraine-L',
//     lineHeight: 22
//   },
//   phoneText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     textAlign: 'center',
//     color: Colors.accent500,
//     fontFamily: 'e-Ukraine-M'
//   },
//   formattedPhoneText: {
//     fontSize: 16,
//     color: Colors.text,
//     marginTop: 8,
//     marginBottom: 16,
//     fontFamily: 'e-Ukraine-L'
//   },
//   errorText: {
//     fontSize: 14,
//     color: 'red',
//     marginTop: 8,
//     marginBottom: 16,
//     textAlign: 'center',
//     fontFamily: 'e-Ukraine-L'
//   },
//   phoneInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 8,
//     borderColor: Colors.borderColor,
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     width: '100%',
//     height: 56,
//     backgroundColor: '#fafafa'
//   },
//   prefix: {
//     fontSize: 18,
//     fontFamily: 'e-Ukraine-M',
//     color: Colors.text,
//     marginRight: 5
//   },
//   phoneInput: {
//     flex: 1,
//     height: 56,
//     fontSize: 18,
//     fontFamily: 'e-Ukraine-L'
//   },
//   codeInputWrapper: {
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 16
//   },
//   codeInput: {
//     height: 56,
//     borderColor: Colors.borderColor,
//     borderWidth: 1,
//     borderRadius: 8,
//     marginVertical: 16,
//     fontSize: 24,
//     textAlign: 'center',
//     letterSpacing: 10,
//     width: '80%',
//     backgroundColor: '#fafafa',
//     fontFamily: 'e-Ukraine-M'
//   },
//   buttonWrapper: {
//     width: '100%',
//     marginVertical: 8
//   },
//   actionButton: {
//     height: 54,
//     borderRadius: 8
//   },
//   buttonText: {
//     fontFamily: 'e-Ukraine-M',
//     fontSize: 16
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center'
//   },
//   resendButton: {
//     alignSelf: 'center',
//     marginTop: 16,
//     padding: 10
//   },
//   resendButtonDisabled: {
//     opacity: 0.6
//   },
//   resendButtonText: {
//     color: Colors.primary500,
//     fontSize: 16,
//     fontFamily: 'e-Ukraine-L',
//     textDecorationLine: 'underline'
//   },
//   buttonContainer: {
//     marginTop: 32,
//     width: '100%'
//   },
//   logoutButton: {
//     padding: 12,
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     marginTop: 8
//   },
//   logoutButtonText: {
//     color: Colors.accent500,
//     fontSize: 16,
//     fontFamily: 'e-Ukraine-L'
//   },
//   verifiedContainer: {
//     alignItems: 'center',
//     paddingVertical: 20,
//     width: '100%'
//   },
//   successIconWrapper: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: Colors.success,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16
//   },
//   verifiedText: {
//     fontSize: 18,
//     fontFamily: 'e-Ukraine-M',
//     color: Colors.success,
//     marginTop: 16,
//     marginBottom: 8
//   },
//   redirectText: {
//     fontSize: 14,
//     fontFamily: 'e-Ukraine-L',
//     color: Colors.gray,
//     marginTop: 8
//   }
// });

// export default PhoneVerification;