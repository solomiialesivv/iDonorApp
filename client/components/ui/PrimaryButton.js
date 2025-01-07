import { StyleSheet, View, Text, Pressable } from "react-native";

import Colors from "../../constants/Colors";

function PrimaryButton({ children, onPress}){
    return(
    <View style={styles.buttonOuterContainer}>
        <Pressable 
            style={({pressed}) => 
                pressed 
                    ? [styles.pressed, styles.buttonInnerContainer] 
                    : styles.buttonInnerContainer} 
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
        marginTop: 12
    },
    buttonInnerContainer:{
        backgroundColor: Colors.primary500,
        paddingVertical: 8,
        paddingHorizontal: 16,
        elevation: 2,
    },
    buttonText:{
        fontSize: 20,
        color: Colors.white,
        textAlign: 'center'
    },
    pressed:{
        opacity: 0.75
    }
})