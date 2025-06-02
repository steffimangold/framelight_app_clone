// app/index.tsx
import { Redirect } from "expo-router";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Index() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null); // Add proper typing
  const auth = getAuth();

  useEffect(() => {
    console.log("Index component: Setting up auth listener");

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(
        "Auth state changed:",
        currentUser ? "User logged in" : "No user"
      );
      setUser(currentUser);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  if (initializing) {
    console.log("Index component: Still initializing, showing loading screen");
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="mt-4 text-white">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    console.log("Index component: No user, redirecting to welcome");
    return <Redirect href="/(auth)/welcome" />;
  } else {
    console.log("Index component: User logged in, redirecting to dashboard");
    return <Redirect href="/(tabs)/dashboard" />;
  }
}
