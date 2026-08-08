import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Avatar,
  Button,
  Dialog,
  Icon,
  IconButton,
  SegmentedButtons,
  Portal,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { endpoints } from '../services/api';
import { Notice } from '../components/UI';

function AccountRow({ icon, title, value, last = false, isDark = false }) {
  return (
    <View
      style={[
        styles.accountRow,
        isDark && styles.darkAccountRow,
        last && styles.lastAccountRow,
      ]}
    >
      <View style={styles.rowIcon}>
        <Icon source={icon} size={21} color="#E11D2E" />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{title}</Text>
        <Text
          style={[styles.rowValue, isDark && styles.darkPrimaryText]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { mode, isDark, setMode } = useAppTheme();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [logoutDialog, setLogoutDialog] = useState(false);

  const email = user?.email || 'Customer';
  const displayName = email.split('@')[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  const changePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('Please complete all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation do not match.');
      return;
    }

    setBusy(true);
    try {
      await endpoints.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmLogout = () => {
    setLogoutDialog(true);
  };

  const completeLogout = async () => {
    setLogoutDialog(false);
    await logout();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, isDark && styles.darkSafeArea]}
      edges={['top']}
    >
      <StatusBar style="light" backgroundColor="#7F1D1D" translucent={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.screen, isDark && styles.darkScreen]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            isDark && styles.darkScreen,
          ]}
        >
          <LinearGradient
            colors={['#7F1D1D', '#DC2626', '#FB7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerEyebrow}>YOUR ACCOUNT</Text>
                <Text style={styles.headerTitle}>Profile</Text>
              </View>
              <IconButton
                icon="cog-outline"
                iconColor="#FFFFFF"
                containerColor="rgba(255,255,255,0.16)"
                size={22}
              />
            </View>

            <View style={[styles.identityCard, isDark && styles.darkCard]}>
              <View style={styles.avatarWrap}>
                <Avatar.Text
                  size={70}
                  label={initials}
                  color="#FFFFFF"
                  style={styles.avatar}
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.verifiedMark}>
                  <Icon source="check" size={13} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.identityCopy}>
                <Text
                  style={[
                    styles.customerName,
                    isDark && styles.darkPrimaryText,
                  ]}
                >
                  {displayName}
                </Text>
                <Text style={styles.customerEmail} numberOfLines={1}>
                  {email}
                </Text>
                <View style={styles.roleBadge}>
                  <Icon source="account-check-outline" size={14} color="#E11D2E" />
                  <Text style={styles.roleText}>VERIFIED CUSTOMER</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.content, isDark && styles.darkScreen]}>
            <View style={styles.sectionHeading}>
              <View>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.sectionTitle,
                    isDark && styles.darkPrimaryText,
                  ]}
                >
                  Account details
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Your StayFlow account information
                </Text>
              </View>
              <Icon source="account-circle-outline" size={26} color="#E11D2E" />
            </View>

            <View style={[styles.detailsCard, isDark && styles.darkCard]}>
              <AccountRow
                icon="email-outline"
                title="Email address"
                value={email}
                isDark={isDark}
              />
              <AccountRow
                icon="account-outline"
                title="Account type"
                value="Customer"
                isDark={isDark}
              />
              <AccountRow
                icon="shield-check-outline"
                title="Account status"
                value="Active and verified"
                last
                isDark={isDark}
              />
            </View>

            <View style={[styles.preferenceCard, isDark && styles.darkCard]}>
              <View style={styles.preferenceCopy}>
                <View style={styles.preferenceIcon}>
                  <Icon source="bell-outline" size={22} color="#E11D2E" />
                </View>
                <View style={styles.preferenceText}>
                  <Text
                    style={[
                      styles.preferenceTitle,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    Booking notifications
                  </Text>
                  <Text style={styles.preferenceSubtitle}>
                    Receive trip and reservation updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                color="#E11D2E"
                onValueChange={setNotifications}
              />
            </View>

            <View style={[styles.themeCard, isDark && styles.darkCard]}>
              <View style={styles.themeHeading}>
                <View style={styles.preferenceIcon}>
                  <Icon
                    source={isDark ? 'weather-night' : 'white-balance-sunny'}
                    size={22}
                    color="#E11D2E"
                  />
                </View>
                <View style={styles.preferenceText}>
                  <Text
                    style={[
                      styles.preferenceTitle,
                      isDark && styles.darkPrimaryText,
                    ]}
                  >
                    App appearance
                  </Text>
                  <Text style={styles.preferenceSubtitle}>
                    Choose your preferred theme
                  </Text>
                </View>
              </View>

              <SegmentedButtons
                value={mode}
                onValueChange={setMode}
                buttons={[
                  {
                    value: 'light',
                    label: 'Light',
                    icon: 'white-balance-sunny',
                    checkedColor: '#881337',
                    uncheckedColor: isDark ? '#FFFFFF' : '#52525B',
                  },
                  {
                    value: 'dark',
                    label: 'Dark',
                    icon: 'weather-night',
                    checkedColor: '#881337',
                    uncheckedColor: isDark ? '#FFFFFF' : '#52525B',
                  },
                ]}
                theme={{
                  colors: {
                    secondaryContainer: '#FECDD3',
                    onSecondaryContainer: '#881337',
                    outline: isDark ? '#52525B' : '#D4D4D8',
                  },
                }}
              />
            </View>

            <View style={styles.passwordHeading}>
              <View>
                <Text
                  variant="titleLarge"
                  style={[
                    styles.sectionTitle,
                    isDark && styles.darkPrimaryText,
                  ]}
                >
                  Change password
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Keep your account secure
                </Text>
              </View>
              <Icon source="lock-reset" size={26} color="#E11D2E" />
            </View>

            <View style={[styles.passwordCard, isDark && styles.darkCard]}>
              <TextInput
                mode="outlined"
                label="Current password"
                secureTextEntry={!showOldPassword}
                autoComplete="current-password"
                value={oldPassword}
                onChangeText={setOldPassword}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowOldPassword((current) => !current)}
                  />
                }
                activeOutlineColor="#E11D2E"
                style={[styles.input, isDark && styles.darkInput]}
              />

              <TextInput
                mode="outlined"
                label="New password"
                secureTextEntry={!showNewPassword}
                autoComplete="new-password"
                value={newPassword}
                onChangeText={setNewPassword}
                left={<TextInput.Icon icon="lock-plus-outline" />}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowNewPassword((current) => !current)}
                  />
                }
                activeOutlineColor="#E11D2E"
                style={[styles.input, isDark && styles.darkInput]}
              />

              <TextInput
                mode="outlined"
                label="Confirm new password"
                secureTextEntry={!showNewPassword}
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                left={<TextInput.Icon icon="lock-check-outline" />}
                activeOutlineColor="#E11D2E"
                style={[styles.input, isDark && styles.darkInput]}
              />

              <Button
                mode="contained"
                icon="shield-key-outline"
                buttonColor="#E11D2E"
                textColor="#FFFFFF"
                contentStyle={styles.primaryButtonContent}
                loading={busy}
                disabled={busy}
                onPress={changePassword}
              >
                Update password
              </Button>
            </View>

            <Button
              mode="outlined"
              icon="logout"
              textColor="#DC2626"
              style={styles.logoutButton}
              contentStyle={styles.logoutButtonContent}
              onPress={confirmLogout}
            >
              Sign out
            </Button>

            <Text style={styles.version}>StayFlow Customer · Version 1.0.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Notice message={message} onDismiss={() => setMessage('')} />

      <Portal>
        <Dialog
          visible={logoutDialog}
          onDismiss={() => setLogoutDialog(false)}
          style={[
            styles.logoutDialog,
            isDark && styles.darkLogoutDialog,
          ]}
        >
          <Dialog.Icon icon="logout" color="#E11D2E" />
          <Dialog.Title
            style={[
              styles.logoutDialogTitle,
              isDark && styles.darkPrimaryText,
            ]}
          >
            Sign out?
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={[
                styles.logoutDialogMessage,
                isDark && styles.darkDialogMessage,
              ]}
            >
              You will need to enter your email and password to access StayFlow
              again.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.logoutDialogActions}>
            <Button
              textColor={isDark ? '#F4F4F5' : '#52525B'}
              onPress={() => setLogoutDialog(false)}
            >
              Stay signed in
            </Button>
            <Button
              mode="contained"
              icon="logout"
              buttonColor="#E11D2E"
              textColor="#FFFFFF"
              onPress={completeLogout}
            >
              Sign out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#7F1D1D',
  },
  darkSafeArea: {
    // The header remains red in dark mode, so its top safe area must match.
    backgroundColor: '#7F1D1D',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  darkScreen: {
    backgroundColor: '#09090B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    marginTop: 3,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  identityCard: {
    marginTop: 17,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#18181B',
  },
  avatarLabel: {
    fontSize: 24,
    fontWeight: '900',
  },
  verifiedMark: {
    position: 'absolute',
    right: -2,
    bottom: 1,
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 99,
    backgroundColor: '#16A34A',
  },
  identityCopy: {
    flex: 1,
    marginLeft: 14,
  },
  customerName: {
    color: '#18181B',
    fontSize: 21,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  customerEmail: {
    marginTop: 2,
    color: '#71717A',
    fontSize: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
  },
  roleText: {
    color: '#9F1239',
    fontSize: 9,
    fontWeight: '900',
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionHeading: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordHeading: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#18181B',
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 2,
    color: '#71717A',
    fontSize: 12,
  },
  detailsCard: {
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  accountRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  lastAccountRow: {
    borderBottomWidth: 0,
  },
  darkAccountRow: {
    borderBottomColor: '#3F3F46',
  },
  rowIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
  },
  rowCopy: {
    flex: 1,
    marginLeft: 12,
  },
  rowLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '800',
  },
  rowValue: {
    marginTop: 3,
    color: '#18181B',
    fontSize: 14,
    fontWeight: '800',
  },
  preferenceCard: {
    marginTop: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  themeCard: {
    marginTop: 14,
    padding: 15,
    gap: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  darkCard: {
    backgroundColor: '#18181B',
  },
  themeHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkPrimaryText: {
    color: '#FFFFFF',
  },
  preferenceCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
  },
  preferenceText: {
    flex: 1,
    marginLeft: 12,
  },
  preferenceTitle: {
    color: '#18181B',
    fontSize: 14,
    fontWeight: '800',
  },
  preferenceSubtitle: {
    marginTop: 2,
    color: '#71717A',
    fontSize: 10,
  },
  passwordCard: {
    marginTop: 14,
    padding: 16,
    gap: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  darkInput: {
    backgroundColor: '#27272A',
  },
  primaryButtonContent: {
    height: 50,
  },
  logoutButton: {
    marginTop: 18,
    borderColor: '#FCA5A5',
  },
  logoutButtonContent: {
    height: 50,
  },
  version: {
    marginTop: 18,
    color: '#A1A1AA',
    textAlign: 'center',
    fontSize: 10,
  },
  logoutDialog: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  darkLogoutDialog: {
    backgroundColor: '#18181B',
  },
  logoutDialogTitle: {
    color: '#18181B',
    textAlign: 'center',
    fontWeight: '900',
  },
  logoutDialogMessage: {
    color: '#52525B',
    textAlign: 'center',
    lineHeight: 21,
  },
  darkDialogMessage: {
    color: '#A1A1AA',
  },
  logoutDialogActions: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
});
