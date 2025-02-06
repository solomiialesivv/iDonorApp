import { View, Text, Image, StyleSheet } from "react-native";
import Colors from "../../constants/Colors";

const StatisticCard = ({ title, imageSource, count }) => {
    return (
        <View style={styles.cardContainer}>
            <Text style={styles.statisticText}>{title}</Text>
            <View style={styles.contentContainer}>
                <Image source={imageSource} style={styles.iconPhoto} />
                <Text style={styles.textCount}>{count}</Text>
            </View>
        </View>
    );
};

export default StatisticCard;

const styles = StyleSheet.create({
    cardContainer: {
        width: '48%',
        maxHeight: '100%',
        backgroundColor: Colors.background,
        marginTop: 8,
        borderRadius: 4,
        padding: 8,
        elevation: 3
    },
    statisticText: {
        fontFamily: 'e-Ukraine-R',
        color: Colors.accent500,
        fontSize: 13,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconPhoto: {
        width: 40,
        height: 40,
        marginTop: 12,
        marginBottom: 12,
    },
    textCount: {
        fontFamily: 'e-Ukraine-B',
        fontSize: 32,
        color: Colors.accent500,
        marginLeft: 8,
    },
});
