// app/tickets.tsx
import { db } from "@/FirebaseConfig";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import LargeMovieTicket from "@/components/LargeMovieTicket";

interface TicketData {
  id: string;
  title: string;
  poster_path: string;
  type: string;
  watchedAt: any;
  vote_average?: number;
  [key: string]: any;
}

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh
  const router = useRouter();
  const auth = getAuth();
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async (isRefreshing = false) => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/(auth)/welcome");
      return;
    }

    try {
      // Don't show main loading indicator if we're just refreshing
      if (!isRefreshing) {
        setLoading(true);
      }

      const ticketsRef = collection(db, "users", user.uid, "tickets");

      const q = query(ticketsRef, orderBy("watchedAt", "desc"));
      const ticketsSnap = await getDocs(q);

      const ticketsData = ticketsSnap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as TicketData[];

      setTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      Toast.show({
        type: "error",
        text1: isRefreshing
          ? "Failed to refresh tickets"
          : "Failed to load tickets",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets(true);
  };

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-10">
      <View className="bg-[#172730] p-8 rounded-3xl items-center w-72 border border-[#3cab9340]">
        <View className="bg-[#3cab9320] p-4 rounded-full mb-4">
          <MaterialIcons name="local-movies" size={50} color="#3cab93" />
        </View>
        <Text className="text-white font-semibold text-lg text-center mb-2">
          No tickets yet
        </Text>
        <Text className="text-gray text-center text-sm mb-4">
          When you mark content as watched, you'll collect tickets here
        </Text>
        <TouchableOpacity
          className="bg-[#3cab93] py-3 px-6 rounded-full"
          onPress={() => router.push("/(tabs)/saved")}
        >
          <Text className="text-white font-medium">Go to Watchlist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Group tickets by year
  const groupTicketsByYear = () => {
    const groups: { [key: string]: TicketData[] } = {};

    tickets.forEach((ticket) => {
      if (!ticket.watchedAt?.toDate) return;

      const date = ticket.watchedAt.toDate();
      const year = date.getFullYear().toString();

      if (!groups[year]) {
        groups[year] = [];
      }

      groups[year].push(ticket);
    });

    // Sort years in descending order
    return Object.keys(groups)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .map((year) => ({
        year,
        data: groups[year],
      }));
  };

  return (
    <View className="flex-1 bg-primary ">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="w-full flex-row items-center mt-12 mb-6 px-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2">
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">My Tickets</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3cab93" />
        </View>
      ) : tickets.length === 0 ? (
        renderEmptyList()
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3cab93"]} // Android
              tintColor="#3cab93" // iOS
              title="Pull to refresh" // iOS
              titleColor="#ffffff" // iOS
            />
          }
        >
          {groupTicketsByYear().map((group) => (
            <View key={group.year} className="mb-8">
              {/* Year header */}
              <View className="px-4 mb-4 flex-row items-center">
                <Text className="text-white text-lg font-bold mr-2">
                  {group.year}
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: "#3cab9350" }}
                />
              </View>

              {/* Horizontal scrolling tickets */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
              >
                {group.data.map((item) => (
                  <LargeMovieTicket
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    poster_path={item.poster_path}
                    type={item.type}
                    watchedAt={item.watchedAt}
                    vote_average={item.vote_average}
                    onPress={() =>
                      router.push(
                        `/${item.type === "tv" ? "tvs" : "movies"}/${item.id}`
                      )
                    }
                  />
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}

      <Toast />
    </View>
  );
}
