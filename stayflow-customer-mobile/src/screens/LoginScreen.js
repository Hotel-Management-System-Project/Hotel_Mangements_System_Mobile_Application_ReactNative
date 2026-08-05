import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Notice } from '../components/UI';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { login } = useAuth();

  const heroProgress = useRef(new Animated.Value(0)).current;
  const formProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroProgress, {
        toValue: 1,
        duration: 500,
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

  const submit = async () => {
    setBusy(true);
    try {
      await login({ email, password });
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
            Your next stay starts here.
          </Text>
          <Text style={styles.heroSub}>
            Explore approved hotels and book rooms securely.
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
          Welcome back
        </Text>

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
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          contentStyle={styles.inputContent}
          theme={inputTheme}
          mode="outlined"
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="password"
          left={<TextInput.Icon icon="lock-outline" color="#FCA5A5" />}
          value={password}
          onChangeText={setPassword}
        />

        <Button
          compact
          textColor="#FCA5A5"
          style={styles.forgotButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          Forgot password?
        </Button>

        <Button
          mode="contained"
          buttonColor="#DC2626"
          textColor="#FFFFFF"
          contentStyle={styles.signInButton}
          loading={busy}
          disabled={busy}
          onPress={submit}
        >
          Sign in
        </Button>

        <Button
          textColor="#FCA5A5"
          onPress={() => navigation.navigate('Signup')}
        >
          Sign up
        </Button>
      </Animated.View>

      <Notice message={message} onDismiss={() => setMessage('')} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#27272A',
  },
  heroContainer: {
    height: '42%',
  },
  hero: {
    flex: 1,
    padding: 28,
    paddingTop: 70,
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
    marginTop: 24,
    color: '#09090B',
    fontWeight: '900',
  },
  heroSub: {
    marginTop: 10,
    color: '#18181B',
    fontSize: 16,
  },
  form: {
    flex: 1,
    marginTop: -26,
    padding: 24,
    gap: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#27272A',
  },
  formTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#18181B',
  },
  inputContent: {
    minHeight: 54,
    color: '#FFFFFF',
  },
  signInButton: {
    height: 52,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -10,
  },
});
