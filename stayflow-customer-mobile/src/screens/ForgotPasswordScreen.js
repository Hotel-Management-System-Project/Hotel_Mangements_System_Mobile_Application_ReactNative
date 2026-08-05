import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { endpoints } from '../services/api';
import { Notice } from '../components/UI';

/** Email OTP flow for resetting a customer password without an active session. */
export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const normalizedEmail = email.trim().toLowerCase();
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const sendCode = async () => {
    if (!emailIsValid) {
      setMessage('Enter a valid registered email address.');
      return;
    }
    setBusy(true);
    try {
      await endpoints.sendPasswordResetOtp(normalizedEmail);
      setOtpSent(true);
      setMessage('Verification code sent to your email.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (code.trim().length < 4) {
      setMessage('Enter the verification code.');
      return;
    }
    if (password.length < 6) {
      setMessage('New password must contain at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await endpoints.resetPassword(normalizedEmail, code.trim(), password);
      setMessage('Password reset successfully. Please sign in.');
      setTimeout(() => navigation.replace('Login'), 900);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const inputTheme = {
    colors: {
      primary: '#EF4444',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#D4D4D8',
      outline: '#52525B',
      background: '#18181B',
    },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <LinearGradient colors={['#7F1D1D', '#DC2626', '#FB7185']} style={styles.hero}>
          <Text style={styles.logo}>S</Text>
          <Text variant="headlineLarge" style={styles.heroTitle}>Reset your password</Text>
          <Text style={styles.heroText}>Verify your registered email and create a secure new password.</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text variant="headlineSmall" style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? 'Enter the code sent to your email.'
              : 'We will email you a one-time verification code.'}
          </Text>

          <TextInput
            mode="outlined"
            label="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!otpSent}
            left={<TextInput.Icon icon="email-outline" color="#FCA5A5" />}
            style={styles.input}
            contentStyle={styles.inputContent}
            theme={inputTheme}
          />

          {otpSent && (
            <>
              <TextInput
                mode="outlined"
                label="Verification code"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                left={<TextInput.Icon icon="shield-key-outline" color="#FCA5A5" />}
                style={styles.input}
                contentStyle={styles.inputContent}
                theme={inputTheme}
              />
              <TextInput
                mode="outlined"
                label="New password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                left={<TextInput.Icon icon="lock-outline" color="#FCA5A5" />}
                style={styles.input}
                contentStyle={styles.inputContent}
                theme={inputTheme}
              />
              <TextInput
                mode="outlined"
                label="Confirm new password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                left={<TextInput.Icon icon="lock-check-outline" color="#FCA5A5" />}
                style={styles.input}
                contentStyle={styles.inputContent}
                theme={inputTheme}
              />
            </>
          )}

          <Button
            mode="contained"
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            loading={busy}
            disabled={busy}
            contentStyle={styles.action}
            onPress={otpSent ? resetPassword : sendCode}
          >
            {otpSent ? 'Reset password' : 'Send verification code'}
          </Button>

          {otpSent && (
            <Button textColor="#FCA5A5" disabled={busy} onPress={sendCode}>
              Resend verification code
            </Button>
          )}
          <Button textColor="#FCA5A5" onPress={() => navigation.goBack()}>
            Back to sign in
          </Button>
        </View>
      </ScrollView>
      <Notice message={message} onDismiss={() => setMessage('')} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#27272A' },
  content: { flexGrow: 1, backgroundColor: '#27272A' },
  hero: {
    minHeight: 270,
    paddingHorizontal: 28,
    paddingTop: 62,
    paddingBottom: 52,
    justifyContent: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#09090B',
    color: '#EF4444',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 25,
    fontWeight: '900',
  },
  heroTitle: { marginTop: 22, color: '#09090B', fontWeight: '900' },
  heroText: { marginTop: 8, color: '#18181B', fontSize: 15 },
  card: {
    flex: 1,
    marginTop: -28,
    padding: 24,
    gap: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#27272A',
  },
  title: { color: '#FFFFFF', fontWeight: '800' },
  subtitle: { color: '#AEB1B9', marginBottom: 4 },
  input: { backgroundColor: '#18181B' },
  inputContent: { minHeight: 54, color: '#FFFFFF' },
  action: { height: 52 },
});
