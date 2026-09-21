import { MongoClient } from 'mongodb';
import 'dotenv/config'; // Automatically loads the .env file

const client = new MongoClient(process.env.MONGO_URI);
let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    console.log("Connected to MongoDB successfully");
    db = client.db("portfolioApp"); // Connects to the DB specified in MONGO_URI
  }
  return db;
}

export function getDB() {
  if (!db) throw new Error("Database not initialized. Call connectDB first.");
  return db;
}
