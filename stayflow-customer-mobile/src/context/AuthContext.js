import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { endpoints } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        await AsyncStorage.multiRemove([
          "stayflow_token",
          "stayflow_user",
        ]);

        const savedUser = await AsyncStorage.getItem(
          "stayflow_user_v2"
        );

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log("Failed to restore login:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedUser();
  }, []);

  const login = async (credentials) => {
    const data = await endpoints.login(credentials);
    const normalizedRole = String(data.role || "").replace(
      /^ROLE_/,
      ""
    );

    if (normalizedRole !== "CUSTOMER") {
      throw new Error(
        "This mobile application is for customers only."
      );
    }

    if (!data.token) {
      throw new Error(
        "Login response did not contain a JWT token."
      );
    }

    const loggedInUser = {
      userId: data.userId,
      fullName: data.fullName,
      email: data.email,
      role: normalizedRole,
    };

    await AsyncStorage.multiSet([
      ["stayflow_token_v2", data.token],
      ["stayflow_user_v2", JSON.stringify(loggedInUser)],
    ]);

    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      "stayflow_token_v2",
      "stayflow_user_v2",
    ]);

    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}