// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuojGnWTEtrlW1E6tT9eNkG1qmYHmSwfs",
    authDomain: "idonor-6b2c1.firebaseapp.com",
    projectId: "idonor-6b2c1",
    storageBucket: "idonor-6b2c1.firebasestorage.app",
    messagingSenderId: "708927276226",
    appId: "1:708927276226:web:a0fa44286761d43063a75b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the app
export { app };