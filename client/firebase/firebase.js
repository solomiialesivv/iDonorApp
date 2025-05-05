import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Ваша конфігурація Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDuojGnWTEtrlW1E6tT9eNkG1qmYHmSwfs",
  authDomain: "idonor-6b2c1.firebaseapp.com",
  projectId: "idonor-6b2c1",
  storageBucket: "idonor-6b2c1.firebasestorage.app",
  messagingSenderId: "708927276226",
  appId: "1:708927276226:web:a0fa44286761d43063a75b"
};

// Ініціалізація Firebase
let app;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Ініціалізація модульної версії
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebase, firebaseConfig };

// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyDuojGnWTEtrlW1E6tT9eNkG1qmYHmSwfs",
//     authDomain: "idonor-6b2c1.firebaseapp.com",
//     projectId: "idonor-6b2c1",
//     storageBucket: "idonor-6b2c1.firebasestorage.app",
//     messagingSenderId: "708927276226",
//     appId: "1:708927276226:web:a0fa44286761d43063a75b"
// };

// const app = initializeApp(firebaseConfig);

// // Ensure Auth is only initialized once
// let auth;
// try {
//   auth = getAuth(app); 
// } catch (error) {
//   auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
//   });
// }

// const db = getFirestore(app);

// export { app, auth, db };