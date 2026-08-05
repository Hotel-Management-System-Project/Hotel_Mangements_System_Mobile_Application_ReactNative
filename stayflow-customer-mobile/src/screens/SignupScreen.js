import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { endpoints } from '../services/api';
import { Notice } from '../components/UI';

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [busy, setBusy] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [message, setMessage] = useState('');

  const heroProgress = useRef(new Animated.Value(0)).current;
  const formProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroProgress, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(formProgress, {
        toValue: 1,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [formProgress, heroProgress]);

  const inputTheme = {
    colors: {
      primary: '#EF4444',
      onSurface: '#FFFFFF',
      onSurfaceVariant: '#D4D4D8',
      outline: '#52525B',
      background: '#18181B',
    },
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const sendOtp = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Enter a valid email address first.');
      return;
    }

    setOtpBusy(true);
    try {
      await endpoints.sendSignupOtp(email);
      setOtpSent(true);
      setOtpVerified(false);
      setVerificationToken('');
      setOtp('');
      setMessage('Verification code sent. Check your email.');
    } catch (error) {
      setMessage(error.message || 'Verification code could not be sent.');
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setMessage('Enter the six-digit verification code.');
      return;
    }

    setOtpBusy(true);
    try {
      const result = await endpoints.verifySignupOtp(
        form.email.trim().toLowerCase(),
        otp,
      );
      setVerificationToken(result.verificationToken);
      setOtpVerified(true);
      setMessage('Email verified successfully. You can now create your account.');
    } catch (error) {
      setMessage(error.message || 'Incorrect verification code.');
    } finally {
      setOtpBusy(false);
    }
  };

  const changeEmail = () => {
    setOtpSent(false);
    setOtpVerified(false);
    setVerificationToken('');
    setOtp('');
  };

  const submit = async () => {
    if (!otpVerified || !verificationToken) {
      setMessage('Verify your email before creating the account.');
      return;
    }
    if (!form.fullName.trim() || !form.phone.trim() || !form.password) {
      setMessage('Complete all signup fields.');
      return;
    }
    if (form.password.length < 6) {
      setMessage('Password must contain at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      await endpoints.signup({
        ...form,
        email: form.email.trim().toLowerCase(),
        emailVerificationToken: verificationToken,
      });
      setMessage('Customer account created successfully. Please sign in.');
      setTimeout(() => navigation.replace('Login'), 1000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: heroProgress,
              transform: [
                {
                  translateY: heroProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-35, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#7F1D1D', '#DC2626', '#FB7185']}
            style={styles.hero}
          >
            <Text style={styles.logo}>S</Text>
            <Text variant="displaySmall" style={styles.heroTitle}>
              Join StayFlow today.
            </Text>
            <Text style={styles.heroSubtitle}>
              Create your account and start booking approved hotels.
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[
            styles.form,
            {
              opacity: formProgress,
              transform: [
                {
                  translateY: formProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [55, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text variant="headlineMedium" style={styles.formTitle}>
            Create account
          </Text>
          <Text style={styles.formSubtitle}>
            Enter your details to continue.
          </Text>

          <TextInput
            style={styles.input}
            contentStyle={styles.inputContent}
            theme={inputTheme}
            mode="outlined"
            label="Full name"
            placeholder="Enter your full name"
            autoCapitalize="words"
            autoComplete="name"
            left={<TextInput.Icon icon="account-outline" color="#FCA5A5" />}
            value={form.fullName}
            onChangeText={(value) => updateField('fullName', value)}
          />

          <TextInput
            style={styles.input}
            contentStyle={styles.inputContent}
            theme={inputTheme}
            mode="outlined"
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="email-outline" color="#FCA5A5" />}
            value={form.email}
            onChangeText={(value) => updateField('email', value)}
            disabled={otpSent}
          />

          <Button
            mode="outlined"
            icon={otpSent ? 'email-edit-outline' : 'email-fast-outline'}
            textColor="#FCA5A5"
            style={styles.otpButton}
            contentStyle={styles.otpButtonContent}
            loading={otpBusy && !otpSent}
            disabled={otpBusy || otpVerified}
            onPress={otpSent ? changeEmail : sendOtp}
          >
            {otpSent ? 'Change email' : 'Send verification code'}
          </Button>

          {otpSent && !otpVerified && (
            <>
              <TextInput
                style={styles.input}
                contentStyle={styles.inputContent}
                theme={inputTheme}
                mode="outlined"
                label="Six-digit verification code"
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                left={<TextInput.Icon icon="shield-key-outline" color="#FCA5A5" />}
                value={otp}
                onChangeText={(value) =>
                  setOtp(value.replace(/\D/g, '').slice(0, 6))
                }
              />
              <Button
                mode="contained-tonal"
                icon="check-decagram-outline"
                buttonColor="#FECACA"
                textColor="#7F1D1D"
                contentStyle={styles.otpButtonContent}
                loading={otpBusy}
                disabled={otpBusy || otp.length !== 6}
                onPress={verifyOtp}
              >
                Verify email
              </Button>
            </>
          )}

          {otpVerified && (
            <Text style={styles.verifiedText}>
              ✓ Email address verified
            </Text>
          )}

          <TextInput
            style={styles.input}
            contentStyle={styles.inputContent}
            theme={inputTheme}
            mode="outlined"
            label="Phone number"
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            autoComplete="tel"
            left={<TextInput.Icon icon="phone-outline" color="#FCA5A5" />}
            value={form.phone}
            onChangeText={(value) => updateField('phone', value)}
          />

          <TextInput
            style={styles.input}
            contentStyle={styles.inputContent}
            theme={inputTheme}
            mode="outlined"
            label="Password"
            placeholder="Create a secure password"
            secureTextEntry
            autoComplete="new-password"
            left={<TextInput.Icon icon="lock-outline" color="#FCA5A5" />}
            value={form.password}
            onChangeText={(value) => updateField('password', value)}
          />

          <Button
            mode="contained"
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            contentStyle={styles.createButton}
            loading={busy}
            disabled={busy || !otpVerified}
            onPress={submit}
          >
            Create account
          </Button>

          <Button
            textColor="#FCA5A5"
            onPress={() => navigation.replace('Login')}
          >
            Already have an account? Sign in
          </Button>
        </Animated.View>
      </ScrollView>

      <Notice message={message} onDismiss={() => setMessage('')} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#27272A',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#27272A',
  },
  heroContainer: {
    marginTop: 0,
  },
  hero: {
    minHeight: 315,
    padding: 28,
    paddingTop: 64,
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
  heroTitle: {
    marginTop: 22,
    color: '#09090B',
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 10,
    color: '#18181B',
    fontSize: 16,
    lineHeight: 23,
  },
  form: {
    flex: 1,
    marginTop: -26,
    padding: 24,
    paddingBottom: 36,
    gap: 15,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#27272A',
  },
  formTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formSubtitle: {
    marginTop: -8,
    marginBottom: 2,
    color: '#D4D4D8',
  },
  input: {
    backgroundColor: '#18181B',
  },
  inputContent: {
    minHeight: 54,
    color: '#FFFFFF',
  },
  createButton: {
    height: 52,
  },
  otpButton: {
    borderColor: '#F87171',
  },
  otpButtonContent: {
    minHeight: 48,
  },
  verifiedText: {
    paddingVertical: 10,
    color: '#4ADE80',
    textAlign: 'center',
    fontWeight: '800',
  },
});
