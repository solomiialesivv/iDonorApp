import { View, Text, StyleSheet, Image, Button } from "react-native";

import Colors from '../constants/Colors';
import PrimaryButton from "../components/ui/PrimaryButton";
import StatisticCard from "../components/ui/StatisticCard";
import ActionButton from "../components/ui/ActionButton";

import { auth } from "../firebase/firebase";

// const signOut = () => {
//     auth.signOut()
// }
const AuthenticatedScreen = ({ user, handleAuthentication }) => {
    return (
        <View style={styles.rootContainer}>
            <Text style={styles.userName}>Вітаємо, {user.userName}!</Text>
            <Text style={styles.mainText}>Хочете задонатити свою кров?</Text>
            <View>
                <Image
                    source={require('../assets/images/donate_savelife.png')}
                    style={styles.photoContainer}
                />
            </View>
            <PrimaryButton style={{borderRadius: 28, padding: 4}}>Перейти до медцентрів</PrimaryButton>
            <View style={styles.buttonContainer}>
                <View style={styles.halfContainer}>
                    <ActionButton>Переглянути потреби</ActionButton>
                </View>
                <View style={styles.halfContainer}>
                    <ActionButton style={{ backgroundColor: Colors.primary500 }}>
                        Запланувати донацію
                    </ActionButton>
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <StatisticCard
                    title="К-сть донацій крові"
                    imageSource={require('../assets/images/rb_savelife.png')}
                    count="19"
                />
                <StatisticCard
                    title="К-сть крові в літрах"
                    imageSource={require('../assets/images/rb_donations.png')}
                    count="4"
                
                />
            </View>
            <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
        </View>
    );
};

export default AuthenticatedScreen;

const styles = StyleSheet.create({
    rootContainer: {
        width: '96%',
        maxWidth: 500,
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 8,
        elevation: 3,
    },
    userName: {
        fontSize: 18,
        marginBottom: 24,
        color: Colors.text,
        fontFamily: 'e-Ukraine-L',
    },
    mainText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.accent500,
        fontFamily: 'e-Ukraine-M',
    },
    photoContainer: {
        borderRadius: 4,
        width: '100%',
        height: 90,
        marginTop: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    halfContainer: {
        width: '48%',
        maxHeight: '100%',
        elevation: 3
    },
});