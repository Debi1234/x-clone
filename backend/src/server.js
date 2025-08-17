import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
    res.send("Hello World");
});

// Start server function
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        console.log("Database connected successfully");

        // Start listening
        const PORT = ENV.PORT || 5001;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);;
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
startServer();