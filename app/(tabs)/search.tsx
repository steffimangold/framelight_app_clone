import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ActorCard from "@/components/ActorCard";
import PosterCard from "@/components/PosterCard";
import SearchBar from "@/components/Searchbar";
import { getGenreById } from "@/constants/genres";
import { fetchMultiSearch } from "@/services/api";
import useFetch from "@/services/useFetch";

// Define types for search results - made more flexible to match API response
type SearchResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  media_type?: string; // Changed from strict union to string to match API
  known_for_department?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  known_for?: any[];
  [key: string]: any;
};

type MediaTypeFilter = "all" | "movie" | "tv" | "person";

// Get screen dimensions
const screenWidth = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 20; // Increased padding for more space on sides
const SIDE_MARGIN = 8; // Increased spacing between cards
const TOTAL_SPACING = (NUM_COLUMNS - 1) * SIDE_MARGIN;
const ITEM_WIDTH =
  (screenWidth - 2 * HORIZONTAL_PADDING - TOTAL_SPACING) / NUM_COLUMNS;

// Custom PosterCardWrapper to control size
const PosterCardWrapper = (props: any) => {
  // Calculate aspect ratio for poster image
  const imageHeight = ITEM_WIDTH * 1.5; // Keep 2:3 aspect ratio

  return (
    <View
      style={{ width: ITEM_WIDTH, marginRight: SIDE_MARGIN, marginBottom: 15 }} // Increased bottom margin
    >
      <PosterCard
        {...props}
        customWidth={ITEM_WIDTH}
        customHeight={imageHeight}
      />
    </View>
  );
};

// Custom ActorCardWrapper for consistent sizing
const ActorCardWrapper = (props: any) => {
  return (
    <View
      style={{ width: ITEM_WIDTH, marginRight: SIDE_MARGIN, marginBottom: 15 }} // Increased bottom margin
    >
      <ActorCard
        id={props.id}
        name={props.name || "Unknown"}
        profile_path={props.profile_path || null}
        known_for_department={props.known_for_department}
        known_for={props.known_for}
      />
    </View>
  );
};

// Filter Modal Component
const FilterModal = ({
  visible,
  onClose,
  mediaTypeFilter,
  setMediaTypeFilter,
  selectedGenre,
  setSelectedGenre,
  resultCounts,
  availableGenres,
}: {
  visible: boolean;
  onClose: () => void;
  mediaTypeFilter: MediaTypeFilter;
  setMediaTypeFilter: (value: MediaTypeFilter) => void;
  selectedGenre: number | null;
  setSelectedGenre: (value: number | null) => void;
  resultCounts: any;
  availableGenres: number[];
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-5">
        <View className="bg-[#1a2025] rounded-lg p-5 w-full max-w-sm border border-[#3cab9340]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-semibold">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Media Type Filter */}
          <View className="mb-6">
            <Text className="text-white font-medium text-sm mb-3">
              Media Type:
            </Text>
            {[
              { value: "all", label: "All Types", count: resultCounts.all },
              { value: "movie", label: "Movies", count: resultCounts.movie },
              { value: "tv", label: "TV Shows", count: resultCounts.tv },
              { value: "person", label: "Actors", count: resultCounts.person },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() =>
                  setMediaTypeFilter(option.value as MediaTypeFilter)
                }
                className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                  mediaTypeFilter === option.value
                    ? "bg-[#3cab9320] border border-[#3cab93]"
                    : "bg-[#253239]"
                }`}
              >
                <Text
                  className={`${
                    mediaTypeFilter === option.value
                      ? "text-[#3cab93]"
                      : "text-white"
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="text-gray text-sm">({option.count})</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Genre Filter - Only show when relevant */}
          {availableGenres.length > 0 &&
            (mediaTypeFilter === "all" ||
              mediaTypeFilter === "movie" ||
              mediaTypeFilter === "tv") && (
              <View className="mb-6">
                <Text className="text-white font-medium text-sm mb-3">
                  Genre:
                </Text>
                <ScrollView className="max-h-48">
                  <TouchableOpacity
                    onPress={() => setSelectedGenre(null)}
                    className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                      selectedGenre === null
                        ? "bg-[#3cab9320] border border-[#3cab93]"
                        : "bg-[#253239]"
                    }`}
                  >
                    <Text
                      className={`${
                        selectedGenre === null ? "text-[#3cab93]" : "text-white"
                      }`}
                    >
                      All Genres
                    </Text>
                  </TouchableOpacity>

                  {availableGenres.map((genreId) => {
                    const genre = getGenreById(genreId);
                    return (
                      <TouchableOpacity
                        key={genreId}
                        onPress={() => setSelectedGenre(genreId)}
                        className={`flex-row items-center justify-between p-3 rounded-lg mb-2 ${
                          selectedGenre === genreId
                            ? "bg-[#3cab9320] border border-[#3cab93]"
                            : "bg-[#253239]"
                        }`}
                      >
                        <Text
                          className={`${
                            selectedGenre === genreId
                              ? "text-[#3cab93]"
                              : "text-white"
                          }`}
                        >
                          {genre?.name || `Genre ${genreId}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

          {/* Action Buttons */}
          <View className="flex-row space-x-3 gap-2">
            <TouchableOpacity
              onPress={() => {
                setMediaTypeFilter("all");
                setSelectedGenre(null);
              }}
              className="flex-1 bg-[#161f24] py-3 rounded-lg border border-[#3cab9340]"
            >
              <Text className="text-white text-center font-medium">
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-[#3cab93] py-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] =
    useState<MediaTypeFilter>("all");
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const router = useRouter();

  const {
    data: results = [],
    loading,
    error,
    refetch: loadResults,
    reset,
  } = useFetch(() => fetchMultiSearch({ query: searchQuery }), false);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // Reset filters when searching
    if (text.trim() === "") {
      setMediaTypeFilter("all");
      setSelectedGenre(null);
      setShowFilters(false);
    } else {
      setShowFilters(true);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        await loadResults();
      } else {
        reset();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Safe array check with proper typing
  const safeResults: SearchResult[] = Array.isArray(results) ? results : [];

  // Filter results based on selected filters
  const filteredResults = safeResults.filter((item: SearchResult) => {
    // Media type filter - handle undefined media_type
    if (mediaTypeFilter !== "all") {
      if (!item.media_type || item.media_type !== mediaTypeFilter) {
        return false;
      }
    }

    // Genre filter (only applies to movies and TV shows)
    if (
      selectedGenre &&
      item.media_type &&
      (item.media_type === "movie" || item.media_type === "tv")
    ) {
      if (!item.genre_ids || !item.genre_ids.includes(selectedGenre)) {
        return false;
      }
    }

    return true;
  });

  // Count results by media type - with safe checking
  const resultCounts = {
    all: safeResults.length,
    movie: safeResults.filter(
      (item: SearchResult) => item.media_type === "movie"
    ).length,
    tv: safeResults.filter((item: SearchResult) => item.media_type === "tv")
      .length,
    person: safeResults.filter(
      (item: SearchResult) => item.media_type === "person"
    ).length,
  };

  // Get unique genres from current results
  const availableGenres = Array.from(
    new Set(
      safeResults
        .filter(
          (item: SearchResult) =>
            item.media_type === "movie" || item.media_type === "tv"
        )
        .flatMap((item: SearchResult) => item.genre_ids || [])
    )
  ).sort();

  // Function to render items based on their media type
  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.media_type === "person") {
      return (
        <ActorCardWrapper
          id={item.id}
          name={item.name || "Unknown"}
          profile_path={item.profile_path || null}
          known_for_department={item.known_for_department}
          known_for={item.known_for}
        />
      );
    } else {
      // For movies and TV shows, use the PosterCardWrapper
      return (
        <PosterCardWrapper
          id={Number(item.id)}
          title={(item.title || item.name) ?? "Untitled"}
          poster_path={item.poster_path || null}
          vote_average={item.vote_average || 0}
          release_date={item.release_date || item.first_air_date || ""}
          media_type={item.media_type === "tv" ? "tv" : "movie"}
        />
      );
    }
  };

  return (
    <View className="flex-1 bg-primary pt-20">
      <FlatList
        className="px-5" // Increased padding to match HORIZONTAL_PADDING
        data={filteredResults}
        keyExtractor={(item) => `${item.media_type || "unknown"}-${item.id}`}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={{
          justifyContent: "flex-start",
          marginBottom: 15, // Increased vertical spacing between rows
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View className="mb-3">
              <SearchBar
                placeholder="Search for movies, shows, actors..."
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* Compact Filter Button */}
            {showFilters && safeResults.length > 0 && (
              <View className="mb-5 ">
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => setFilterModalVisible(true)}
                    className="flex-row items-center bg-[#1a2025] border border-[#3cab9340] rounded-lg px-4 py-2 flex-1 mr-3"
                  >
                    <MaterialIcons
                      name="filter-list"
                      size={20}
                      color="#3cab93"
                    />
                    <Text className="text-white text-sm ml-2 flex-1">
                      {mediaTypeFilter === "all" && selectedGenre === null
                        ? "All Results"
                        : `${
                            mediaTypeFilter === "all"
                              ? "All Types"
                              : mediaTypeFilter === "movie"
                                ? "Movies"
                                : mediaTypeFilter === "tv"
                                  ? "TV Shows"
                                  : "Actors"
                          }${selectedGenre ? ` • ${getGenreById(selectedGenre)?.name}` : ""}`}
                    </Text>
                    <MaterialIcons
                      name="keyboard-arrow-down"
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {(mediaTypeFilter !== "all" || selectedGenre !== null) && (
                    <TouchableOpacity
                      onPress={() => {
                        setMediaTypeFilter("all");
                        setSelectedGenre(null);
                      }}
                      className="bg-[#3cab9320] rounded-lg p-2"
                    >
                      <MaterialIcons name="clear" size={20} color="#3cab93" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Results count */}
                <Text className="text-gray text-sm mt-3">
                  Showing {filteredResults.length} of {safeResults.length}{" "}
                  results
                </Text>
              </View>
            )}

            {/* Filter Modal */}
            <FilterModal
              visible={filterModalVisible}
              onClose={() => setFilterModalVisible(false)}
              mediaTypeFilter={mediaTypeFilter}
              setMediaTypeFilter={setMediaTypeFilter}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              resultCounts={resultCounts}
              availableGenres={availableGenres}
            />

            {loading && (
              <ActivityIndicator
                size="large"
                color="#3cab93"
                className="my-3"
              />
            )}

            {error && (
              <Text className="text-red-500 px-5 my-3">
                Error: {error.message}
              </Text>
            )}

            {!loading &&
              !error &&
              searchQuery.trim() &&
              safeResults.length > 0 && (
                <Text className="text-xl text-white font-bold mb-4 px-5">
                  Search Results for{" "}
                  <Text className="text-accent">{searchQuery}</Text>
                </Text>
              )}
          </>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className="mt-10 px-5">
              <Text className="text-center text-gray">
                {searchQuery.trim()
                  ? safeResults.length > 0
                    ? "No results match your filters"
                    : "Nothing found"
                  : "Start typing..."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default Search;
