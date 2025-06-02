const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { db } = require("./firebase");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 🔍 Sample route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// 🔥 Example Firebase route
app.get("/searches", async (req, res) => {
  try {
    const snapshot = await db.collection("searches").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
