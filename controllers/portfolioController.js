import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { portfolioInfo } from "../models/portInfoModels.js";

export const updatePortfolio = async (req, res) => {
  try {
    // 1. Get the ID string from the URL parameters
    const { id } = req.params;

    // 2. Prevent MongoDB crashes by ensuring the ID string is a valid 24-char hex format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    // 3. Format data using your model
    const cleanData = portfolioInfo.format(req.body);

    // 4. Access the database
    const db = getDB();
    const collection = db.collection("portfolio");

    // 5. Update the document
    const result = await collection.updateOne(
      { _id: new ObjectId(id) }, // Convert string to ObjectId
      { $set: cleanData },
    );

    // 6. Handle the case where the ID was valid, but didn't exist in the DB
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Updated successfully", result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getPortfolio = async (req, res) => {
  try {
    // 1. Get the ID string from the URL parameters
    const { id } = req.params;

    // 2. Prevent MongoDB crashes by ensuring the ID string is a valid 24-char hex format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    // 4. Access the database
    const db = getDB();
    const collection = db.collection("portfolio");

    // 5. Update the document
    const result = await collection.findOne(
      { _id: new ObjectId(id) }, // Convert string to ObjectId
      { projection: { _id: 0 } },
    );

    // 6. Handle the case where the ID was valid, but didn't exist in the DB
    if (!result) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Fetched successfully", result });
  } catch (error) {
    console.error(error);

    res.status(400).json({ error: error.message });
  }
};

export const getSkills = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");

    const result = await collection.findOne(
      { _id: new ObjectId("6aa03a63131f38ee7be163bd") },{projection:{_id:0}} // Convert string to ObjectId
    );

    if (!result) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Fetched successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const makeCatagory = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = {};

    const data = req.body.catagory;

    if (data !== undefined) body.catagory = String(data).trim().toUpperCase();
    console.log(data);

    const result = await collection.updateOne(
      {
        _id: new ObjectId("6aa03a63131f38ee7be163bd"),
        [body.catagory]: { $exists: false },
      }, // Convert string to ObjectId
      { $set: { [body.catagory]: [] } },
    );

    if (!result) {
      return res.json({ error: "Document not found" });
    }

    res.json({ message: "Inserted successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const updateCatagory = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = {};

    const data = req.body;

    if (data.catagory !== undefined)
      body.catagory = String(data.catagory).trim().toUpperCase();
    if (data.target_catagory !== undefined)
      body.target_catagory = String(data.target_catagory).trim().toUpperCase();
    console.log(data);

    const result = await collection.updateOne(
      {
        _id: new ObjectId("6aa03a63131f38ee7be163bd"),
        [body.target_catagory]: { $exists: true },
      }, // Convert string to ObjectId
      { $rename: { [body.target_catagory]: body.catagory } },
    );

    if (!result.modifiedCount) {
      return res.status(417).json({ error: "catagory not updated" });
    }

    res.json({ message: "Updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const removeCatagory = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = {};

    const data = req.body.catagory;

    if (data !== undefined) body.catagory = String(data).trim().toUpperCase();
    console.log(data);

    const result = await collection.updateOne(
      {
        _id: new ObjectId("6aa03a63131f38ee7be163bd"),
        [body.catagory]: { $exists: true },
      },
      { $unset: { [body.catagory]: "" } },
    );

    if (!result) {
      return res.json({ error: "Document not found" });
    }

    res.status(204).json({ message: "Deleted successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const addSkill = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = req.body;
    let skillCtgory;
    const data = {};

    if (
      body.catagory !== undefined &&
      body.catagory !== "" &&
      body.name !== undefined &&
      body.name !== "" &&
      body.desc !== undefined &&
      body.desc !== "" &&
      body.url !== undefined &&
      body.url !== ""
    ) {
      skillCtgory = String(body.catagory).trim().toUpperCase();
      data.ID = new ObjectId()
      data.name = String(body.name);
      data.desc = String(body.desc);
      data.url = String(body.url);
    }else{
      throw new Error("Missing data field");
    } 

    const result = await collection.updateOne(
      {
        _id: new ObjectId("6aa03a63131f38ee7be163bd"),
        [skillCtgory]: { $exists: true },
      },
      { $push: { [skillCtgory]: data } },
    );

    if (!result.modifiedCount) {
      return res.status(417).json({ error: "Skill not updated" });
    }

    res.json({ message: "Updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};



export const removeSkill = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = req.body;
    let skillID, skillCatagory;
    if (
      body.ID !== undefined &&
      body.catagory !== undefined &&
      body.catagory !== "" &&
      body.ID !== ""
    ) {
      skillID = new ObjectId(body.ID);
      skillCatagory = body.catagory.trim().toUpperCase();
    }else{
      throw new Error("Missing data field");
    } 

    const result = await collection.updateOne(
      {
        _id: new ObjectId("6aa03a63131f38ee7be163bd"),
        [skillCatagory]: { $exists: true },
      },
      { $pull: { [skillCatagory]: {ID: skillID } } },
    );


    console.log(result);

    if (!result.modifiedCount) {
      return res.status(417).json({ error: "Skill not removed" });
    }

    res.json({ message: "removed successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
