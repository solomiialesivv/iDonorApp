import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';

import { app } from '../firebase/firebase';
import AuthScreen from "./AuthScreen";
import AuthenticatedScreen from "./AuthenticatedScreen";


export default ProtectScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState(null); // Track user authentication state
    const [isLogin, setIsLogin] = useState(true);

    const auth = getAuth(app);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
    
        return () => unsubscribe();
    }, [auth]);

    const handleAuthentication = async () => {
        try {
            if (user) {
                // If user is already authenticated, log out
                console.log('User logged out successfully!');
                await signOut(auth);
            } else {
                // Sign in or sign up
                if (isLogin) {
                    // Sign in
                    await signInWithEmailAndPassword(auth, email, password);
                    console.log('User signed in successfully!');
                } else {
                    // Sign up
                    await createUserWithEmailAndPassword(auth, email, password);
                    console.log('User created successfully!');
                }
            }
        } catch (error) {
            console.error('Authentication error:', error.message);
            // Display alert based on error code
            if (error.code === 'auth/invalid-email') {
                Alert.alert('Invalid Email', 'The email address is not valid.');
            } else if (error.code === 'auth/user-not-found') {
                Alert.alert('User Not Found', 'No user found with this email address.');
            } else if (error.code === 'auth/wrong-password') {
                Alert.alert('Incorrect Password', 'The password is incorrect.');
            } else if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Email Already Registered', 'This email address is already registered.');
            } else {
                Alert.alert('Authentication Error', 'An unknown error occurred.');
            }
        }
    };
    
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {user ? (
            // Show user's email if user is authenticated
            <AuthenticatedScreen user={user} handleAuthentication={handleAuthentication} />
            ) : (
            // Show sign-in or sign-up form if user is not authenticated
            <AuthScreen
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isLogin={isLogin}
                setIsLogin={setIsLogin}
                handleAuthentication={handleAuthentication}
            />
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f0f0f0',
    }
});