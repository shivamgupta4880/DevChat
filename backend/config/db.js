const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    
    // Attempt external connection if provided
    if (process.env.MONGO_URI) {
      try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB Connected to External URI");
        return;
      } catch (err) {
        console.log("External URI failed or timed out. Falling back to In-Memory Database...");
      }
    }

    // Fallback to In-Memory DB
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    console.log("MongoDB Connected to Local In-Memory DB (Success!)");

  } catch (err) {
    console.error("DB ERROR:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;