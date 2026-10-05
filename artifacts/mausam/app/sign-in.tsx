import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter, type Href } from "expo-router";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import { AuthPrimaryButton, AuthShell, AuthTextInput } from "../components/AuthShell";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [message, setMessage] = useState("");
  const busy = fetchStatus === "fetching";

  const finishSignIn = async () => {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          setMessage("Complete the additional verification step in your account, then sign in again.");
          return;
        }
        router.replace("/" as Href);
      },
    });
  };

  const submitPassword = async () => {
    setMessage("");
    const result = await signIn.password({ emailAddress: email.trim(), password });
    if (result.error) {
      setMessage(result.error.message || "We couldn’t sign you in. Check your email and password.");
      return;
    }
    if (signIn.status === "complete") {
      await finishSignIn();
      return;
    }
    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const emailFactor = signIn.supportedSecondFactors.find((factor) => factor.strategy === "email_code");
      if (!emailFactor) {
        setMessage("This account needs another verification method. Contact support for help signing in.");
        return;
      }
      const result = await signIn.mfa.sendEmailCode();
      if (result.error) {
        setMessage(result.error.message || "We couldn’t send a verification code.");
        return;
      }
      setVerificationRequired(true);
      return;
    }
    setMessage("Sign-in needs another step. Please try again.");
  };

  const submitCode = async () => {
    setMessage("");
    const result = await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (result.error) {
      setMessage(result.error.message || "That verification code didn’t work.");
      return;
    }
    if (signIn.status === "complete") await finishSignIn();
    else setMessage("Verification is not complete yet. Check the code and try again.");
  };

  const signInWithGoogle = async () => {
    setMessage("");
    try {
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({ scheme: "mausam", path: "oauth-callback" }),
      });
      if (!result.createdSessionId || !result.setActive) {
        setMessage("Google sign-in needs an extra account step. Try email and password, or enable Google in the Replit Auth pane.");
        return;
      }
      await result.setActive({
        session: result.createdSessionId,
        navigate: () => router.replace("/" as Href),
      });
    } catch {
      setMessage("Google sign-in isn’t available yet. Try email and password, or enable Google in the Replit Auth pane.");
    }
  };

  if (isSignedIn) return <Redirect href="/" />;

  return (
    <AuthShell
      title={verificationRequired ? "Verify it’s you" : "Welcome back"}
      subtitle={verificationRequired ? "Enter the verification code sent to your email." : "Sign in to get your saved locations and personalized forecast."}
    >
      {verificationRequired ? (
        <>
          <AuthTextInput label="EMAIL CODE" value={code} onChangeText={setCode} placeholder="Enter the 6-digit code" keyboardType="numeric" autoComplete="one-time-code" />
          <AuthPrimaryButton label={busy ? "Checking…" : "Verify and sign in"} onPress={() => void submitCode()} disabled={busy || code.trim().length < 4} />
          <Pressable onPress={() => void signIn.mfa.sendEmailCode()} style={styles.secondary}><Text style={[styles.link, { color: colors.primary }]}>Send me a new code</Text></Pressable>
          <Pressable onPress={() => { setVerificationRequired(false); setCode(""); setMessage(""); }} style={styles.secondary}><Text style={[styles.link, { color: colors.mutedForeground }]}>Back to sign in</Text></Pressable>
        </>
      ) : (
        <>
          <AuthTextInput label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
          <AuthTextInput label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry autoComplete="password" />
          <AuthPrimaryButton label={busy ? "Signing in…" : "Sign in"} onPress={() => void submitPassword()} disabled={busy || !email.trim() || !password} />
          <Pressable onPress={() => void signInWithGoogle()} disabled={busy} style={[styles.googleButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.googleText, { color: colors.foreground }]}>Continue with Google</Text>
          </Pressable>
          <View style={styles.switchLine}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>New to MAUSAM? </Text>
            <Pressable onPress={() => router.push("/sign-up" as Href)}><Text style={[styles.link, { color: colors.primary }]}>Create an account</Text></Pressable>
          </View>
        </>
      )}
      {message || errors.fields.identifier || errors.fields.password || errors.fields.code ? (
        <View style={[styles.errorBox, { backgroundColor: colors.destructive + "15" }]}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {message || errors.fields.identifier?.message || errors.fields.password?.message || errors.fields.code?.message}
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
