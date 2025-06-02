import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../FirebaseConfig";


// Function to update the search count for a movie
export const updateSearchCount = async (searchTerm: string, movie: Movie) => {
  try {
    const movieRef = doc(db, "movies", movie.id);
    const metricsRef = collection(movieRef, "metrics");

    const metricsQuery = query(
      metricsRef,
      where("searchTerm", "==", searchTerm)
    );
    const querySnapshot = await getDocs(metricsQuery);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      await updateDoc(docSnap.ref, {
        count: docSnap.data().count + 1,
      });
    } else {
      await addDoc(metricsRef, {
        searchTerm,
        title: movie.title,
        poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        movie_id: movie.id,
        count: 1,
      });
    }
  } catch (error) {
    console.error("Error updating search count:", error);
    throw error;
  }
};

// Function to get trending movies based on the highest count
export const getTrendingMovies = async () => {
  try {
    const moviesSnapshot = await getDocs(collection(db, "movies"));
    const trendingMovies = [];

    for (const movieDoc of moviesSnapshot.docs) {
      const metricsRef = collection(movieDoc.ref, "metrics");
      const topMetricQuery = query(
        metricsRef,
        orderBy("count", "desc"),
        limit(1)
      );
      const metricsSnapshot = await getDocs(topMetricQuery);

      if (!metricsSnapshot.empty) {
        const metric = metricsSnapshot.docs[0].data();
        trendingMovies.push({
          movie_id: movieDoc.id,
          title: movieDoc.data().title,
          poster_url: metric.poster_url,
          count: metric.count,
        });
      }
    }

    trendingMovies.sort((a, b) => b.count - a.count);
    return trendingMovies.slice(0, 5);
  } catch (error) {
    console.error("Error getting trending movies:", error);
    return undefined;
  }
};
