// app/(auth)/login.tsx
import { auth } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      // Handle specific Firebase auth errors
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later");
      } else {
        setError("Login failed. Please check your credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email Required",
        "Please enter your email address first, then tap 'Forgot password?'"
      );
      return;
    }

    Alert.alert("Reset Password", `Send password reset email to ${email}?`, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Send",
        onPress: async () => {
          setResetLoading(true);
          try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
              "Email Sent",
              "Password reset email has been sent. Please check your inbox and follow the instructions to reset your password.",
              [{ text: "OK" }]
            );
          } catch (err: any) {
            let errorMessage = "Failed to send reset email";

            if (err.code === "auth/user-not-found") {
              errorMessage = "No account found with this email address";
            } else if (err.code === "auth/invalid-email") {
              errorMessage = "Invalid email address";
            } else if (err.code === "auth/too-many-requests") {
              errorMessage = "Too many requests. Please try again later";
            }

            Alert.alert("Error", errorMessage);
          } finally {
            setResetLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-primary">
        <StatusBar style="light" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 48,
            paddingBottom: 100,
            minHeight: "100%",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header with back button */}
          <View className="flex-row items-center px-6 pb-6">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">Login</Text>
          </View>

          {/* Login form */}
          <View className="px-6">
            <Text className="text-white text-2xl font-bold mb-8">
              Welcome back 👋
            </Text>

            <View className="w-full">
              <View className="mb-6">
                <Text className="text-gray mb-2">Email</Text>
                <TextInput
                  className="border border-gray rounded-md px-4 py-3 bg-[#1e1e1e] text-white"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray mb-2">Password</Text>
                <TextInput
                  className="border border-gray rounded-md px-4 py-3 bg-[#1e1e1e] text-white"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>

              <TouchableOpacity
                className="self-end mb-6"
                onPress={handleForgotPassword}
                disabled={resetLoading}
              >
                <View className="flex-row items-center">
                  {resetLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#3cab93"
                      className="mr-2"
                    />
                  )}
                  <Text className="text-light-100">
                    {resetLoading ? "Sending..." : "Forgot password?"}
                  </Text>
                </View>
              </TouchableOpacity>

              {error ? (
                <View className="mb-6">
                  <Text className="text-red-500 text-center">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                className="bg-light-100 py-3 rounded-full items-center mb-8"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Login
                  </Text>
                )}
              </TouchableOpacity>

              {/* Register option */}
              <View className="flex-row justify-center">
                <Text className="text-gray">Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register")}
                >
                  <Text className="text-light-100 font-semibold">Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
