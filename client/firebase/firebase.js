// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuojGnWTEtrlW1E6tT9eNkG1qmYHmSwfs",
    authDomain: "idonor-6b2c1.firebaseapp.com",
    projectId: "idonor-6b2c1",
    storageBucket: "idonor-6b2c1.firebasestorage.app",
    messagingSenderId: "708927276226",
    appId: "1:708927276226:web:a0fa44286761d43063a75b"
};

const app = initializeApp(firebaseConfig);

// const auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage),
// });

const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db };