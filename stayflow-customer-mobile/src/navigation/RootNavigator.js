import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Icon } from "react-native-paper";

import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { Loading } from "../components/UI";

// Authentication screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";

// Main screens
import HotelsScreen from "../screens/HotelsScreen";
import HotelDetailsScreen from "../screens/HotelDetailsScreen";
import BookingScreen from "../screens/BookingScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Review screens
import ReviewsScreen from "../screens/ReviewsScreen";
import HotelReviewsScreen from "../screens/HotelReviewsScreen";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

/* Bottom navigation */
function HomeTabs() {
  const { isDark } = useAppTheme();

  const icons = {
    Hotels: "office-building",
    Bookings: "calendar-check",
    Reviews: "star",
    Profile: "account-circle",
  };

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, size }) => (
          <Icon
            source={icons[route.name]}
            color={color}
            size={size}
          />
        ),

        tabBarActiveTintColor: isDark
          ? "#FB7185"
          : "#E11D2E",

        tabBarInactiveTintColor: isDark
          ? "#71717A"
          : "#A1A1AA",

        tabBarStyle: {
          height: 70,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: isDark
            ? "#18181B"
            : "#FFFFFF",
          borderTopColor: isDark
            ? "#27272A"
            : "#E4E4E7",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      })}
    >
      <Tabs.Screen
        name="Hotels"
        component={HotelsScreen}
      />

      <Tabs.Screen
        name="Bookings"
        component={MyBookingsScreen}
      />

      {/* This opens the customer Reviews page */}
      <Tabs.Screen
        name="Reviews"
        component={ReviewsScreen}
      />

      <Tabs.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tabs.Navigator>
  );
}

/* Main root navigation */
export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="Home"
            component={HomeTabs}
          />

          <Stack.Screen
            name="HotelDetails"
            component={HotelDetailsScreen}
          />

          <Stack.Screen
            name="BookRoom"
            component={BookingScreen}
          />

          {/* Reviews for one selected hotel */}
          <Stack.Screen
            name="HotelReviews"
            component={HotelReviewsScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="Signup"
            component={SignupScreen}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}