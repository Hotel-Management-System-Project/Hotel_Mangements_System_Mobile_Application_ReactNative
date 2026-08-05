import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import {
  ActivityIndicator,
  Chip,
  Snackbar,
  Text,
} from "react-native-paper";

import { colors } from "../theme/theme";

// Common screen container
export const Screen = ({ children, style }) => {
  return (
    <View style={[styles.screen, style]}>
      {children}
    </View>
  );
};

// Common page header
export const Header = ({
  eyebrow,
  title,
  subtitle,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>
        {eyebrow}
      </Text>

      <Text
        variant="headlineMedium"
        style={styles.title}
      >
        {title}
      </Text>

      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// Loading indicator
export const Loading = () => {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
};

// Empty data message
export const Empty = ({
  title = "Nothing here yet",
  subtitle,
}) => {
  return (
    <View style={styles.center}>
      <Text variant="titleMedium">
        {title}
      </Text>

      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

// Booking or hotel status chip
export const Status = ({ value }) => {
  const status = String(
    value || "BOOKED"
  ).toUpperCase();

  let backgroundColor = "#FEF0C7";

  if (status === "CANCELLED") {
    backgroundColor = "#FEE4E2";
  }

  if (
    status === "BOOKED" ||
    status === "APPROVED"
  ) {
    backgroundColor = "#D1FADF";
  }

  return (
    <Chip
      compact
      textStyle={styles.statusText}
      style={{ backgroundColor }}
    >
      {status}
    </Chip>
  );
};

// Snackbar notification
export const Notice = ({
  message,
  onDismiss,
}) => {
  return (
    <Snackbar
      visible={Boolean(message)}
      onDismiss={onDismiss}
      action={{
        label: "OK",
      }}
    >
      {message}
    </Snackbar>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },

  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  title: {
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 5,
  },

  center: {
    flex: 1,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  statusText: {
    fontWeight: "700",
  },
});