import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter, type Href } from "expo-router";
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { AuthPrimaryButton, AuthShell, AuthTextInput } from "../components/AuthShell";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [message, setMessage] = useState("");
  const busy = fetchStatus === "fetching";

  const finishSignUp = async () => {
    await signUp.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          setMessage("Complete the additional verification step in your account, then continue.");
          return;
        }
        router.replace("/" as Href);
      },
    });
  };

  const submitSignUp = async () => {
    setMessage("");
    const result = await signUp.password({ emailAddress: email.trim(), password });
    if (result.error) {
      setMessage(result.error.message || "We couldn’t create your account. Check your details and try again.");
      return;
    }
    if (signUp.status === "complete") {
      await finishSignUp();
      return;
    }
    const verification = await signUp.verifications.sendEmailCode();
    if (verification.error) {
      setMessage(verification.error.message || "We couldn’t send the email verification code.");
      return;
    }
    setVerificationRequired(true);
  };

  const verifyEmail = async () => {
    setMessage("");
    const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (result.error) {
      setMessage(result.error.message || "That verification code didn’t work.");
      return;
    }
    if (signUp.status === "complete") await finishSignUp();
    else setMessage("Your account needs another step before setup can continue.");
  };

  const signUpWithGoogle = async () => {
    setMessage("");
    try {
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "mausam", path: "oauth-callback" }),
      });
      if (!result.createdSessionId || !result.setActive) {
        setMessage("Google sign-up needs an extra account step. Try email and password, or enable Google in the Replit Auth pane.");
        return;
      }
      await result.setActive({
        session: result.createdSessionId,
        navigate: () => router.replace("/" as Href),
      });
    } catch {
      setMessage("Google sign-up isn’t available yet. Try email and password, or enable Google in the Replit Auth pane.");
    }
  };

  if (isSignedIn) return <Redirect href="/" />;

  return (
    <AuthShell
      title={verificationRequired ? "Check your inbox" : "Create your account"}
      subtitle={verificationRequired ? "Enter the code we sent to verify your email address." : "Save your weather profile and preferences across devices."}
    >
      {verificationRequired ? (
        <>
          <AuthTextInput label="EMAIL CODE" value={code} onChangeText={setCode} placeholder="Enter the 6-digit code" keyboardType="numeric" autoComplete="one-time-code" />
          <AuthPrimaryButton label={busy ? "Verifying…" : "Verify email"} onPress={() => void verifyEmail()} disabled={busy || code.trim().length < 4} />
          <Pressable onPress={() => void signUp.verifications.sendEmailCode()} style={styles.secondary}><Text style={[styles.link, { color: colors.primary }]}>Send a new code</Text></Pressable>
        </>
      ) : (
        <>
          <AuthTextInput label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
          <AuthTextInput label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry autoComplete="new-password" />
          <AuthPrimaryButton label={busy ? "Creating account…" : "Create account"} onPress={() => void submitSignUp()} disabled={busy || !email.trim() || password.length < 8} />
          <Pressable onPress={() => void signUpWithGoogle()} disabled={busy} style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.googleText, { color: colors.foreground }]}>Continue with Google</Text>
          </Pressable>
          <View style={styles.switchLine}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Already have an account? </Text>
            <Pressable onPress={() => router.push("/sign-in" as Href)}><Text style={[styles.link, { color: colors.primary }]}>Sign in</Text></Pressable>
          </View>
        </>
      )}
      <View nativeID="clerk-captcha" />
      {message || errors.fields.emailAddress || errors.fields.password || errors.fields.code ? (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {message || errors.fields.emailAddress?.message || errors.fields.password?.message || errors.fields.code?.message}
          </Text>
        </View>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  secondary: { paddingVertical: 12, alignItems: "center" },
  link: { fontSize: 13, fontWeight: "700" },
  googleButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 10 },
  googleText: { fontSize: 13, fontWeight: "700" },
  switchLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 },
  switchText: { fontSize: 13 },
  errorBox: { borderRadius: 12, padding: 12, marginTop: 14 },
  errorText: { fontSize: 12, lineHeight: 18 },
});
