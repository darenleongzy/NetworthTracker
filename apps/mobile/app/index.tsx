import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { appTheme } from "@track-my-worth/config";
import { useSession } from "@/src/providers/session-provider";

export default function Index() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}
