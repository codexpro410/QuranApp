import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  
  return (
    <>
      <Stack.Screen options={{ title: "الصفحة غير موجودة" }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>هذه الصفحة غير موجودة</Text>

        <Link href="/" style={[styles.link, { backgroundColor: colors.gold }]}>
          <Text style={[styles.linkText, { color: colors.background }]}>العودة للرئيسية</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

