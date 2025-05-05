import PrimaryButton from "./PrimaryButton";
import { StyleSheet } from "react-native";
import Colors from "../../constants/Colors";

const ActionButton = ({ children, style, onPress, textStyle }) => {
    return (
        <PrimaryButton 
            style={[styles.button, style]} 
            textStyle={[styles.buttonText, textStyle]} 
            onPress={onPress}
        >
            {children}
        </PrimaryButton>
    );
};

export default ActionButton;

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.primary600,
        maxWidth: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        elevation: 0
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'e-Ukraine-M'
    }
});

// import PrimaryButton from "./PrimaryButton";
// import { StyleSheet } from "react-native";

// import Colors from "../../constants/Colors";

// const ActionButton = ({ children, style, onPress, textStyle }) => {
//     return (
//         <PrimaryButton style={[styles.button, style]} textStyle={textStyle} onPress={onPress}>
//             {children}
//         </PrimaryButton>
//     );
// };

// export default ActionButton;

// const styles = StyleSheet.create({
//     button: {
//         flex: 1,
//         fontWeight: '600',
//         backgroundColor: Colors.primary600,
//         maxWidth: '100%',
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 8,
//         elevation: 0
//     },
// });
