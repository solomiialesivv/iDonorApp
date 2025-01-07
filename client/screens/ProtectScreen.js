import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

import { app } from '../firebase/firebase';
import AuthScreen from './AuthScreen';
import AuthenticatedScreen from './AuthenticatedScreen';
import Colors from '../constants/Colors';

const ProtectScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null);
    const [isLogin, setIsLogin] = useState(true);

    const [userName, setUserName] = useState('');
    const [phone, setPhone] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const auth = getAuth(app);
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user.uid); // Отримати дані користувача
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [auth]);

    const fetchUserData = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                setUser({ id: userId, ...userDoc.data() });
            } else {
                Alert.alert('Помилка', 'Користувач не знайдений.');
            }
        } catch (error) {
            console.error('Помилка завантаження даних користувача:', error.message);
        }
    };

    const handleAuthentication = async () => {
        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                fetchUserData(userCredential.user.uid);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userId = userCredential.user.uid;
                await setDoc(doc(db, 'users', userId), {
                    userName,
                    phone,
                    bloodType,
                    birthDate,
                    email,
                });
                fetchUserData(userId);
            }
        } catch (error) {
            console.error('Помилка аутентифікації:', error.message);
            Alert.alert('Помилка', error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            Alert.alert('Вихід', 'Ви успішно вийшли з облікового запису.');
        } catch (error) {
            console.error('Помилка виходу:', error.message);
            Alert.alert('Помилка виходу', 'Не вдалося вийти з облікового запису.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {user ? (
                <AuthenticatedScreen user={user} handleAuthentication={handleLogout} />
            ) : (
                <AuthScreen
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    userName={userName}
                    setUserName={setUserName}
                    phone={phone}
                    setPhone={setPhone}
                    bloodType={bloodType}
                    setBloodType={setBloodType}
                    birthDate={birthDate}
                    setBirthDate={setBirthDate}
                    isLogin={isLogin}
                    setIsLogin={setIsLogin}
                    handleAuthentication={handleAuthentication}
                />
            )}
        </ScrollView>
    );
};

export default ProtectScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.background,
    },
});
