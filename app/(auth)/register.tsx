// app/(auth)/register.tsx
import { auth, db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create a user profile document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        email: user.email,
        createdAt: new Date(),
        // Default avatar and empty fields
        avatarIndex: Math.floor(Math.random() * 12), // Random avatar index
        bio: "",
        favoriteGenres: [],
      });

      // Redirect to dashboard after successful registration
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      // Handle specific Firebase auth errors
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError("Registration failed. Please try again.");
      }
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-primary">
        <StatusBar style="light" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 48,
            paddingBottom: 100, // Extra bottom padding for keyboard
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
            <Text className="text-white text-xl font-bold ml-4">
              Create Account
            </Text>
          </View>

          {/* Registration form */}
          <View className="px-6">
            <Text className="text-white text-2xl font-bold mb-8">
              Join Framelight
            </Text>

            <View className="w-full">
              <View className="mb-6">
                <Text className="text-gray mb-2">Name</Text>
                <TextInput
                  className="border border-gray rounded-md px-4 py-3 bg-[#1e1e1e] text-white"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#666"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

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

              <View className="mb-6">
                <Text className="text-gray mb-2">Password</Text>
                <TextInput
                  className="border border-gray rounded-md px-4 py-3 bg-[#1e1e1e] text-white"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray mb-2">Confirm Password</Text>
                <TextInput
                  className="border border-gray rounded-md px-4 py-3 bg-[#1e1e1e] text-white"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>

              {error ? (
                <View className="mb-6">
                  <Text className="text-red-500 text-center">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                className="bg-light-100 py-3 rounded-full items-center mb-8"
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    Register
                  </Text>
                )}
              </TouchableOpacity>

              {/* Login option */}
              <View className="flex-row justify-center">
                <Text className="text-gray">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text className="text-light-100 font-semibold">Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
