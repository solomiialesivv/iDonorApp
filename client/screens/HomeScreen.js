import { View, Text, StyleSheet } from "react-native";

// Create a simple HomeScreen component
const HomeScreen = () => {
    return (
        <View style={styles.container}>
        <Text style={styles.text}>Home</Text>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});