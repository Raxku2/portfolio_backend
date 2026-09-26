import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export const saveMessage = async (req, res) => {
  try {
    const body = {};
    if (
      req.body.name !== undefined &&
      req.body.message !== undefined &&
      req.body.email !== undefined
    ) {
      body.name = req.body.name;
      body.mail = req.body.email;
      body.message = req.body.message;
      body._id = String(new ObjectId());
    } else {
      res.status(422).send();
    }

    const db = getDB();
    const collection = db.collection("messages");

    const result = await collection.insertOne(body);

    console.log(result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Inserted successfully", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
