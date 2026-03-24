import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "@track-my-worth/config";
import { useSession } from "@/src/providers/session-provider";

const e2eEmail = process.env.EXPO_PUBLIC_E2E_TEST_EMAIL?.trim();
const e2ePassword = process.env.EXPO_PUBLIC_E2E_TEST_PASSWORD ?? "";
const hasE2ECredentials = Boolean(e2eEmail && e2ePassword);

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (signInError) {
      setError(
        signInError instanceof Error ? signInError.message : "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  }

  function applyE2ECredentials() {
    if (!hasE2ECredentials) return;
    setEmail(e2eEmail ?? "");
    setPassword(e2ePassword);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>Track My Worth</Text>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your mobile dashboard.</Text>

        <TextInput
          testID="login-email-input"
          accessibilityLabel="Email"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          testID="login-password-input"
          accessibilityLabel="Password"
          style={styles.input}
          secureTextEntry
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {__DEV__ && hasE2ECredentials ? (
          <Pressable
            testID="login-use-e2e-credentials"
            accessibilityLabel="Use E2E Credentials"
            style={styles.secondaryButton}
            onPress={applyE2ECredentials}
          >
            <Text style={styles.secondaryButtonText}>Use E2E Credentials</Text>
          </Pressable>
        ) : null}

        <Pressable
          testID="login-sign-in-button"
          accessibilityLabel="Sign in"
          style={styles.button}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: appTheme.colors.surface,
    gap: 12,
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: appTheme.colors.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 32,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: appTheme.colors.textMuted,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 8,
    backgroundColor: appTheme.colors.primary,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceMuted,
  },
  secondaryButtonText: {
    color: appTheme.colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
  },
});
