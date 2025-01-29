import { StyleSheet, View, Text, Pressable } from "react-native";

import Colors from "../../constants/Colors";

function PrimaryButton({ children, onPress, style}){
    return(
    <View style={[styles.buttonOuterContainer, style]}>
        <Pressable 
            style={({pressed}) => 
                pressed 
                    ? [styles.pressed, styles.buttonInnerContainer, style] 
                    : [styles.buttonInnerContainer, style]} 
            onPress={onPress} 
            android_ripple={{color: Colors.primary500}}
        >
            <Text style={styles.buttonText}>{children}</Text>
        </Pressable>
    </View>
    );
}

export default PrimaryButton;

const styles = StyleSheet.create({
    buttonOuterContainer:{
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 12,
        marginBottom: 4
    },
    buttonInnerContainer:{
        backgroundColor: Colors.accent500,
        paddingVertical: 8,
        paddingHorizontal: 16,
        elevation: 2,
        justifyContent: 'center', 
        alignItems: 'center'
    },
    buttonText:{
        fontSize: 16,
        fontWeight: '500',
        color: Colors.white,
        textAlign: 'center',
        flexWrap: 'wrap',
        fontFamily: 'e-Ukraine-M'
    },
    pressed:{
        opacity: 0.75
    }
})