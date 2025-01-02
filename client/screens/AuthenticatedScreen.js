import { View, Text, Button, StyleSheet } from "react-native";

const AuthenticatedScreen = ({ user, handleAuthentication }) => {
    return (
        <View style={styles.authContainer}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <Button title="Logout" onPress={handleAuthentication} color="#e74c3c" />
        </View>
    );
};

export default AuthenticatedScreen;

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        marginBottom: 16,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    }
});