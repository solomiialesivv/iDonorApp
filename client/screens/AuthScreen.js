import React from 'react';
import { Image, View, Text, TextInput, Button, StyleSheet } from 'react-native';


const AuthScreen = ({ email, setEmail, password, setPassword, isLogin, setIsLogin, handleAuthentication }) => {
    return (
        <View style={styles.authContainer}>
            <View style={styles.imageContainer}>
                <Image
                source={require('../assets/images/iDonor_appLogo.png')} 
                style={styles.image}
                resizeMode="contain"
                />
            </View>
        <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
        <TextInput 
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder='Email'
            autoCapitalize='none'
        />
        <TextInput 
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder='Password'
            secureTextEntry
        />
        <View style={styles.buttonContainer}>
            <Button title={isLogin ? 'Sign In' : 'Sign Up'} onPress={handleAuthentication} color="#3498db" />
        </View>

        <View style={styles.bottomContainer}>
            <Text style={styles.toggleText} onPress={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </Text>
        </View>
        </View>
    );
}

export default AuthScreen;

const styles = StyleSheet.create({
    authContainer: {
        width: '80%',
        maxWidth: 400,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 120,  // Adjust the width as needed
        height: 120,  // Adjust the height as needed
        marginBottom: 20,  // Space between the image and the title
    },
    title: {
        fontSize: 24,
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        marginBottom: 16,
        padding: 8,
        borderRadius: 4,
    },
    buttonContainer: {
        marginBottom: 16,
    },
    toggleText: {
        color: '#3498db',
        textAlign: 'center',
    },
    bottomContainer: {
        marginTop: 20,
    }
});