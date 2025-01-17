import React from 'react';
import { 
    Image, 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    KeyboardAvoidingView, 
    ScrollView, 
    Platform 
} from 'react-native';
import Colors from '../constants/Colors';
import PrimaryButton from '../components/ui/PrimaryButton';

const AuthScreen = ({
    email,
    setEmail,
    password,
    setPassword,
    userName,
    setUserName,
    phone,
    setPhone,
    bloodType,
    setBloodType,
    birthDate,
    setBirthDate,
    isLogin,
    setIsLogin,
    handleAuthentication,
}) => {
    return (
        // <ScrollView style={styles.screen}>
        //     <KeyboardAvoidingView style={styles.authContainer} behavior='position'>
                <View style={styles.authContainer}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../assets/images/iDonor_appLogo.png')}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>{isLogin ? 'Вхід' : 'Реєстрація'}</Text>
                    {!isLogin && (
                        <>
                            <TextInput
                                style={styles.input}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Ім'я"
                            />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Номер телефону"
                                keyboardType="phone-pad"
                            />
                            <TextInput
                                style={styles.input}
                                value={bloodType}
                                onChangeText={setBloodType}
                                placeholder="Група крові (1-4 з Rh + чи -)"
                            />
                            <TextInput
                                style={styles.input}
                                value={birthDate}
                                onChangeText={setBirthDate}
                                placeholder="Дата народження (ДД.ММ.РРРР)"
                            />
                        </>
                    )}
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Пароль"
                        secureTextEntry
                    />
                    <PrimaryButton onPress={handleAuthentication}>
                        {isLogin ? 'Увійти' : 'Зареєструватися'}
                    </PrimaryButton>
                    <View style={styles.bottomContainer}>
                        <Text style={styles.toggleText}>
                            {isLogin ? 'Ще не маєте акаунту?' : 'Вже маєте акаунт?'}
                        </Text>
                        <Text
                            style={styles.toggleButton}
                            onPress={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Зареєструйтесь' : 'Увійдіть'}
                        </Text>
                    </View>
                </View>
        //     </KeyboardAvoidingView>
        // </ScrollView>
    );
};

export default AuthScreen;

const styles = StyleSheet.create({
    screen: {
        flex: 1
    },
    authContainer: {
        flex:1,
        width: '96%',
        maxWidth: 400,
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        marginTop: 4,
        fontSize: 24,
        marginBottom: 16,
        textAlign: 'center',
        color: Colors.primary500,
        fontFamily: 'e-Ukraine-M'
    },
    input: {
        height: 40,
        borderColor: Colors.borderColor,
        borderWidth: 1,
        marginBottom: 16,
        padding: 8,
        borderRadius: 4,
    },
    toggleText: {
        color: Colors.primary500,
        textAlign: 'center',
        padding: 2,
        fontFamily: 'e-Ukraine-L'
    },
    toggleButton: {
        color: Colors.accent500,
        textAlign: 'center',
        padding: 4,
    },
    bottomContainer: {
        marginTop: 14,
    },
});



// import React from 'react';
// import { Image, View, Text, TextInput, StyleSheet, KeyboardAvoidingView, ScrollView } from 'react-native';
// import Colors from '../constants/Colors';
// import PrimaryButton from '../components/ui/PrimaryButton';

// const AuthScreen = ({
//     email,
//     setEmail,
//     password,
//     setPassword,
//     userName,
//     setUserName,
//     phone,
//     setPhone,
//     bloodType,
//     setBloodType,
//     birthDate,
//     setBirthDate,
//     isLogin,
//     setIsLogin,
//     handleAuthentication,
// }) => {
//     return (
//         <View style={styles.authContainer}>
//             <View style={styles.imageContainer}>
//                 <Image
//                     source={require('../assets/images/iDonor_appLogo.png')}
//                     style={styles.image}
//                     resizeMode="contain"
//                 />
//             </View>
//             <Text style={styles.title}>{isLogin ? 'Вхід' : 'Реєстрація'}</Text>
//             {!isLogin && (
//                 <>
//                     <TextInput
//                         style={styles.input}
//                         value={userName}
//                         onChangeText={setUserName}
//                         placeholder="Ім'я"
//                     />
//                     <TextInput
//                         style={styles.input}
//                         value={phone}
//                         onChangeText={setPhone}
//                         placeholder="Номер телефону"
//                         keyboardType="phone-pad"
//                     />
//                     <TextInput
//                         style={styles.input}
//                         value={bloodType}
//                         onChangeText={setBloodType}
//                         placeholder="Група крові (1-4 з Rh + чи -)"
//                     />
//                     <TextInput
//                         style={styles.input}
//                         value={birthDate}
//                         onChangeText={setBirthDate}
//                         placeholder="Дата народження (ДД.ММ.РРРР)"
//                     />
//                 </>
//             )}
//             <TextInput
//                 style={styles.input}
//                 value={email}
//                 onChangeText={setEmail}
//                 placeholder="Email"
//                 autoCapitalize="none"
//             />
//             <TextInput
//                 style={styles.input}
//                 value={password}
//                 onChangeText={setPassword}
//                 placeholder="Пароль"
//                 secureTextEntry
//             />
//             <PrimaryButton onPress={handleAuthentication}>
//                 {isLogin ? 'Увійти' : 'Зареєструватися'}
//             </PrimaryButton>
//             <View style={styles.bottomContainer}>
//                 <Text style={styles.toggleText}>
//                     {isLogin ? 'Ще не маєте акаунту?' : 'Вже маєте акаунт?'}
//                 </Text>
//                 <Text
//                     style={styles.toggleButton}
//                     onPress={() => setIsLogin(!isLogin)}
//                 >
//                     {isLogin ? 'Зареєструйтесь' : 'Увійдіть'}
//                 </Text>
//             </View>
//         </View>
//     );
// };

// export default AuthScreen;

// const styles = StyleSheet.create({
//     authContainer: {
//         width: '80%',
//         maxWidth: 400,
//         backgroundColor: Colors.white,
//         padding: 16,
//         borderRadius: 8,
//         elevation: 3,
//     },
//     imageContainer: {
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     image: {
//         width: 120,
//         height: 120,
//         marginBottom: 20,
//     },
//     title: {
//         marginTop: 4,
//         fontSize: 24,
//         marginBottom: 16,
//         textAlign: 'center',
//         color: Colors.accent500,
//         fontFamily: 'e-Ukraine-M'
//     },
//     input: {
//         height: 40,
//         borderColor: Colors.borderColor,
//         borderWidth: 1,
//         marginBottom: 16,
//         padding: 8,
//         borderRadius: 4,
//     },
//     toggleText: {
//         color: Colors.primary500,
//         textAlign: 'center',
//         padding: 2,
//         fontFamily: 'e-Ukraine-L'
//     },
//     toggleButton: {
//         color: Colors.accent500,
//         fontFamily: 'e-Ukraine-M',
//         textAlign: 'center',
//         padding: 4,
//     },
//     bottomContainer: {
//         marginTop: 14,
//     },
// });