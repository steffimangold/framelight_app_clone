// app/utils/FirebaseInit.tsx
import { app } from "@/FirebaseConfig";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

interface FirebaseInitProps {
  children: React.ReactNode;
}

// Define the component as a named function
function FirebaseInitComponent({ children }: FirebaseInitProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if Firebase is initialized by accessing the app name
      console.log("FirebaseInit: Checking Firebase initialization status");
      const appName = app.name;
      console.log("FirebaseInit: Firebase initialized with app name:", appName);
      setIsInitialized(true);
    } catch (err) {
      console.error("FirebaseInit: Firebase initialization error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error initializing Firebase"
      );
    }
  }, []);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          backgroundColor: "#121212",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Error initializing app
        </Text>
        <Text style={{ color: "#ff6b6b", fontSize: 14, textAlign: "center" }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#121212",
        }}
      >
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ color: "white", marginTop: 20 }}>
          Initializing app...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

// Add this export default statement at the end of the file
export default FirebaseInitComponent;
