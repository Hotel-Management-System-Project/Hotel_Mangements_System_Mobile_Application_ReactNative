import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  Button,
  Icon,
  Menu,
  Text,
  TextInput,
} from "react-native-paper";

import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";

export default function ReviewsScreen() {
  const { isDark } = useAppTheme();
  const { user } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] =
    useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  /*
    Replace this sample array with your customer
    booking API response.
  */
  const [bookings] = useState([
    {
      bookingId: 16,
      hotelId: 2,
      hotelName: "WhiteHouse",
      roomNumber: 102,
    },
    {
      bookingId: 20,
      hotelId: 5,
      hotelName: "Taj Hotel",
      roomNumber: 201,
    },
    {
      bookingId: 25,
      hotelId: 7,
      hotelName: "Grand Palace",
      roomNumber: 305,
    },
  ]);

  /*
    Replace this sample array with your review API response.
  */
  const [reviews, setReviews] = useState([
    {
      reviewId: 1,
      userId: user?.userId || 1,
      bookingId: 16,
      hotelId: 2,
      hotelName: "WhiteHouse",
      rating: 5,
      comment: "Good 👍",
    },
  ]);

  /*
    Only show one booking option for one hotel.

    Example:
    WhiteHouse booked multiple times,
    but it appears only once.
  */
  const hotelBookings = useMemo(() => {
    const uniqueHotels = new Map();

    bookings.forEach((booking) => {
      if (!uniqueHotels.has(booking.hotelId)) {
        uniqueHotels.set(booking.hotelId, booking);
      }
    });

    return Array.from(uniqueHotels.values());
  }, [bookings]);

  /*
    Select first hotel when screen opens.
  */
  useEffect(() => {
    if (
      hotelBookings.length > 0 &&
      selectedBookingId === null
    ) {
      setSelectedBookingId(
        hotelBookings[0].bookingId,
      );
    }
  }, [hotelBookings, selectedBookingId]);

  /*
    Currently selected hotel booking.
  */
  const selectedBooking = useMemo(() => {
    return hotelBookings.find(
      (booking) =>
        booking.bookingId === selectedBookingId,
    );
  }, [hotelBookings, selectedBookingId]);

  /*
    Check review only for:
    current customer + selected hotel.
  */
  const selectedHotelReview = useMemo(() => {
    if (!selectedBooking) {
      return null;
    }

    return reviews.find((review) => {
      const sameUser =
        Number(review.userId) ===
        Number(user?.userId || 1);

      const sameHotel =
        Number(review.hotelId) ===
        Number(selectedBooking.hotelId);

      return sameUser && sameHotel;
    });
  }, [
    reviews,
    selectedBooking,
    user?.userId,
  ]);

  /*
    true only when selected hotel is reviewed.
  */
  const alreadyReviewed =
    Boolean(selectedHotelReview);

  /*
    Change stars and comment when customer
    selects another hotel.
  */
  useEffect(() => {
    if (selectedHotelReview) {
      setRating(
        Number(selectedHotelReview.rating || 0),
      );

      setComment(
        selectedHotelReview.comment || "",
      );
    } else {
      setRating(5);
      setComment("");
    }
  }, [selectedHotelReview]);

  /*
    Show all reviews created by current customer.
  */
  const customerReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        Number(review.userId) ===
        Number(user?.userId || 1),
    );
  }, [reviews, user?.userId]);

  const selectBooking = (booking) => {
    setSelectedBookingId(booking.bookingId);
    setMenuVisible(false);
  };

  const submitReview = () => {
    if (!selectedBooking) {
      Alert.alert(
        "Booking required",
        "Please select a hotel booking.",
      );
      return;
    }

    if (rating < 1) {
      Alert.alert(
        "Rating required",
        "Please select at least one star.",
      );
      return;
    }

    if (comment.trim().length < 3) {
      Alert.alert(
        "Comment required",
        "Please enter your review.",
      );
      return;
    }

    if (alreadyReviewed) {
      Alert.alert(
        "Already reviewed",
        "You have already reviewed this hotel.",
      );
      return;
    }

    const newReview = {
      reviewId: Date.now(),
      userId: user?.userId || 1,
      bookingId: selectedBooking.bookingId,
      hotelId: selectedBooking.hotelId,
      hotelName: selectedBooking.hotelName,
      rating,
      comment: comment.trim(),
    };

    /*
      Call your create-review API here.

      Example request body:

      {
        userId: user.userId,
        bookingId: selectedBooking.bookingId,
        hotelId: selectedBooking.hotelId,
        rating,
        comment
      }
    */

    setReviews((previousReviews) => [
      ...previousReviews,
      newReview,
    ]);

    Alert.alert(
      "Success",
      `${selectedBooking.hotelName} review submitted successfully.`,
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.screen,
        isDark && styles.darkScreen,
      ]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <LinearGradient
          colors={[
            "#991B1B",
            "#EF233C",
            "#FB7185",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>
            Reviews & ratings
          </Text>

          <Text style={styles.headerSubtitle}>
            Share an honest review after your hotel
            stay.
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.card,
            isDark && styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              isDark && styles.whiteText,
            ]}
          >
            Rate your booking
          </Text>

          <Text style={styles.description}>
            Select a hotel. Each customer can review
            each hotel only once.
          </Text>

          {/* Hotel booking selector */}
          <Menu
            visible={menuVisible}
            onDismiss={() =>
              setMenuVisible(false)
            }
            contentStyle={[
              styles.menuContent,
              isDark && styles.darkCard,
            ]}
            anchor={
              <Pressable
                style={[
                  styles.bookingBox,
                  isDark && styles.darkInput,
                ]}
                onPress={() =>
                  setMenuVisible(true)
                }
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.bookingText,
                    isDark && styles.whiteText,
                  ]}
                >
                  {selectedBooking
                    ? `${selectedBooking.hotelName} · Room #${selectedBooking.roomNumber} · Booking #${selectedBooking.bookingId}`
                    : "Select hotel booking"}
                </Text>

                <Icon
                  source="chevron-down"
                  size={24}
                  color={
                    isDark
                      ? "#FFFFFF"
                      : "#18181B"
                  }
                />
              </Pressable>
            }
          >
            {hotelBookings.map((booking) => {
              const reviewExists =
                reviews.some(
                  (review) =>
                    Number(review.userId) ===
                      Number(
                        user?.userId || 1,
                      ) &&
                    Number(review.hotelId) ===
                      Number(booking.hotelId),
                );

              return (
                <Menu.Item
                  key={booking.hotelId}
                  title={`${booking.hotelName} · Room #${booking.roomNumber}`}
                  description={
                    reviewExists
                      ? "Already reviewed"
                      : "Available for rating"
                  }
                  leadingIcon={
                    reviewExists
                      ? "check-circle"
                      : "star-outline"
                  }
                  onPress={() =>
                    selectBooking(booking)
                  }
                />
              );
            })}
          </Menu>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(
              (star) => (
                <Pressable
                  key={star}
                  disabled={alreadyReviewed}
                  onPress={() =>
                    setRating(star)
                  }
                >
                  <Icon
                    source={
                      star <= rating
                        ? "star"
                        : "star-outline"
                    }
                    size={46}
                    color={
                      star <= rating
                        ? "#F59E0B"
                        : "#71717A"
                    }
                  />
                </Pressable>
              ),
            )}
          </View>

          <TextInput
            mode="outlined"
            multiline
            numberOfLines={5}
            value={comment}
            editable={!alreadyReviewed}
            onChangeText={setComment}
            placeholder="Tell other guests about cleanliness, service, and comfort..."
            textColor={
              isDark ? "#FFFFFF" : "#18181B"
            }
            placeholderTextColor="#A1A1AA"
            outlineColor={
              isDark ? "#3F3F46" : "#D4D4D8"
            }
            activeOutlineColor="#E11D2E"
            style={[
              styles.commentInput,
              isDark && styles.darkInput,
            ]}
          />

          <Button
            mode="contained"
            disabled={
              alreadyReviewed ||
              !selectedBooking
            }
            buttonColor="#E11D2E"
            textColor="#FFFFFF"
            style={styles.submitButton}
            contentStyle={
              styles.submitButtonContent
            }
            onPress={submitReview}
          >
            {alreadyReviewed
              ? "Already reviewed"
              : "Submit review"}
          </Button>
        </View>

        <Text
          style={[
            styles.sectionTitle,
            isDark && styles.whiteText,
          ]}
        >
          Your reviews
        </Text>

        {customerReviews.length === 0 ? (
          <Text style={styles.emptyText}>
            You have not submitted any reviews.
          </Text>
        ) : (
          customerReviews.map((review) => (
            <View
              key={review.reviewId}
              style={[
                styles.reviewCard,
                isDark && styles.darkCard,
              ]}
            >
              <Text
                style={[
                  styles.hotelName,
                  isDark && styles.whiteText,
                ]}
              >
                {review.hotelName ||
                  `Hotel #${review.hotelId}`}
              </Text>

              <View
                style={styles.reviewRatingRow}
              >
                <Text style={styles.reviewStars}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(
                    5 - review.rating,
                  )}
                </Text>

                <Text
                  style={styles.reviewRating}
                >
                  {review.rating}/5
                </Text>
              </View>

              <Text
                style={[
                  styles.reviewComment,
                  isDark && styles.whiteText,
                ]}
              >
                {review.comment}
              </Text>

              <Text
                style={styles.bookingLabel}
              >
                Verified customer booking #
                {review.bookingId}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  darkScreen: {
    backgroundColor: "#09090B",
  },

  content: {
    paddingBottom: 30,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 10,
    color: "#FFE4E6",
    fontSize: 15,
  },

  card: {
    margin: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },

  darkCard: {
    borderColor: "#27272A",
    backgroundColor: "#18181B",
  },

  cardTitle: {
    color: "#18181B",
    fontSize: 24,
    fontWeight: "900",
  },

  description: {
    marginTop: 8,
    color: "#A1A1AA",
    fontSize: 14,
    lineHeight: 20,
  },

  bookingBox: {
    marginTop: 18,
    paddingHorizontal: 16,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#F4F4F5",
  },

  bookingText: {
    flex: 1,
    color: "#18181B",
    fontSize: 15,
    fontWeight: "800",
  },

  menuContent: {
    backgroundColor: "#FFFFFF",
  },

  starsRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  commentInput: {
    marginTop: 20,
    minHeight: 145,
    backgroundColor: "#F4F4F5",
  },

  darkInput: {
    backgroundColor: "#27272A",
  },

  submitButton: {
    marginTop: 18,
    borderRadius: 14,
  },

  submitButtonContent: {
    height: 54,
  },

  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 14,
    color: "#18181B",
    fontSize: 25,
    fontWeight: "900",
  },

  reviewCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },

  hotelName: {
    marginBottom: 10,
    color: "#18181B",
    fontSize: 17,
    fontWeight: "900",
  },

  reviewRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  reviewStars: {
    color: "#F59E0B",
    fontSize: 23,
    fontWeight: "900",
  },

  reviewRating: {
    color: "#F59E0B",
    fontSize: 20,
    fontWeight: "900",
  },

  reviewComment: {
    marginTop: 12,
    color: "#18181B",
    fontSize: 17,
  },

  bookingLabel: {
    marginTop: 10,
    color: "#A1A1AA",
    fontSize: 12,
  },

  emptyText: {
    marginHorizontal: 20,
    color: "#A1A1AA",
    fontSize: 14,
  },

  whiteText: {
    color: "#FFFFFF",
  },
});