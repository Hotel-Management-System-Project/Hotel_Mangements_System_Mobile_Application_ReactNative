import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create Axios instance
export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    "http://192.168.1.6:8081",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

// Reviews are provided by the separate Express.js service.
const reviewApi = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_REVIEW_API_URL ||
    "http://192.168.1.6:4000",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Login and signup do not require JWT token
    const publicUrls = [
      "/api/auth/login",
      "/api/auth/signup",
      "/api/auth/send-signup-otp",
      "/api/auth/verify-signup-otp",
      "/api/auth/forgot-password/send-otp",
      "/api/auth/forgot-password/reset",
    ];

    if (publicUrls.includes(config.url)) {
      delete config.headers.Authorization;
      return config;
    }

    // Get JWT token from AsyncStorage
    const token = await AsyncStorage.getItem(
      "stayflow_token_v2"
    );

    // Add token to request header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const body = response.data;

    // Handle backend custom error response
    if (String(body?.status || "").toLowerCase() === "error") {
      throw new Error(
        body.message || "Request failed"
      );
    }

    // Return data directly
    return body?.data ?? body;
  },

  async (error) => {
    // JWT expired or invalid
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([
        "stayflow_token_v2",
        "stayflow_user_v2",
      ]);

      throw new Error(
        "Backend rejected the JWT token. Please log in again."
      );
    }

    // Get readable backend error message
    const backendMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Unable to connect to StayFlow";

    throw new Error(
      typeof backendMessage === "string"
        ? backendMessage
        : "Something went wrong"
    );
  }
);

// All backend API endpoints
export const endpoints = {
  // Authentication
  login: (data) => {
    return api.post("/api/auth/login", data);
  },

  signup: (data) => {
    return api.post("/api/auth/signup", {
      ...data,
      role: "CUSTOMER",
    });
  },

  sendSignupOtp: (email) => {
    return api.post("/api/auth/send-signup-otp", { email });
  },

  verifySignupOtp: (email, code) => {
    return api.post("/api/auth/verify-signup-otp", { email, code });
  },

  sendPasswordResetOtp: (email) => {
    return api.post("/api/auth/forgot-password/send-otp", { email });
  },

  resetPassword: (email, code, newPassword) => {
    return api.post("/api/auth/forgot-password/reset", {
      email,
      code,
      newPassword,
    });
  },

  changePassword: (data) => {
    return api.put(
      "/api/auth/change-password",
      data
    );
  },

  // Hotels
  hotels: () => {
    return api.get("/api/hotels");
  },

  // Rooms
  rooms: () => {
    return api.get("/getAllRooms");
  },

  // Hotel images
  images: (hotelId) => {
    return api.get(
      `/api/hotel-images/hotel/${hotelId}`
    );
  },

  // Room images
  roomImages: (roomId) => {
    return api.get(
      `/api/room-images/room/${roomId}`
    );
  },

  roomAvailability: (roomId, checkIn, checkOut) => {
    return api.get("/api/booking-rooms/availability", {
      params: { roomId, checkIn, checkOut },
    });
  },

  // Create booking
  createBooking: (data) => {
    return api.post("/api/bookings", data);
  },

  // Get logged-in customer's bookings
  myBookings: () => {
    return api.get("/api/bookings/my");
  },

  // Get rooms connected to a booking
  bookingRooms: (bookingId) => {
    return api.get(
      `/api/booking-rooms/${bookingId}`
    );
  },

  // Add room to booking
  addBookingRoom: (data) => {
    return api.post(
      "/api/booking-rooms",
      data
    );
  },

  createCashPayment: (bookingId) => {
    return api.post(`/api/payments/cash/${bookingId}`);
  },

  createRazorpayOrder: (bookingId) => {
    return api.post(`/api/payments/razorpay/order/${bookingId}`);
  },

  verifyRazorpayPayment: (data) => {
    return api.post('/api/payments/razorpay/verify', data);
  },

  bookingPayment: (bookingId) => {
    return api.get(`/api/payments/booking/${bookingId}`);
  },

  // Cancel booking
  cancelBooking: (bookingId) => {
    return api.put(
      `/api/bookings/cancel/${bookingId}`
    );
  },

  reviewsByHotel: async (hotelId) => {
    const response = await reviewApi.get(`/review/hotel/${hotelId}`);
    return Array.isArray(response.data) ? response.data : [];
  },
};
