import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { portfolioInfo } from "../models/portInfoModels.js";
import { validateAdmin } from "../config/admin.js";
import { deleteImageKitFile } from "../config/imagekit.js";

// The portfolio is split across three documents in the "portfolio" collection.
const INFO_ID = "6a9f92fef914115607467d78";
const SKILLS_ID = "6aa03a63131f38ee7be163bd";
const EXP_ID = "6ab920198240535113feb88e";

const isAdmin = async (req) => {
  try {
    return Boolean(await validateAdmin(req.headers.authorization));
  } catch {
    return false;
  }
};

const asId = (value) => {
  const raw = String(value ?? "").trim();
  return ObjectId.isValid(raw) ? new ObjectId(raw) : null;
};

export const updatePortfolio = async (req, res) => {
  try {
    // 1. Get the ID string from the URL parameters
    const { id } = req.params;

    // 2. Prevent MongoDB crashes by ensuring the ID string is a valid 24-char hex format
    if (!ObjectId.isValid(id) || !req.headers.authorization) {
      return res.status(400).json({ error: "Invalid document ID format" });
    }

    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // 3. Format data using your model
    const cleanData = portfolioInfo.format(req.body);

    // 4. Access the database
    const db = getDB();
    const collection = db.collection("portfolio");
    const targetId = new ObjectId(id);

    const current = await collection.findOne({ _id: targetId });

    // 5. Update the document
    const result = await collection.updateOne(
      { _id: targetId },
      { $set: cleanData },
    );

    // 6. Handle the case where the ID was valid, but didn't exist in the DB
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    // 7. A replaced DP leaves the old upload orphaned in ImageKit.
    if (
      current?.dp_file_id &&
      cleanData.dp_file_id !== undefined &&
      cleanData.dp_file_id !== current.dp_file_id
    ) {
      await deleteImageKitFile(current.dp_file_id);
    }

    const updated = await collection.findOne(
      { _id: targetId },
      { projection: { _id: 0 } },
    );

    res.json({ message: "Updated successfully", result: updated });
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
      { _id: new ObjectId(SKILLS_ID) },
      { projection: { _id: 0 } }, // Convert string to ObjectId
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
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = {};

    const data = req.body.catagory;
    if (data === undefined || String(data).trim() === "") {
      return res.status(400).json({ error: "catagory is required" });
    }
    body.catagory = String(data).trim().toUpperCase();

    const result = await collection.updateOne(
      {
        _id: new ObjectId(SKILLS_ID),
        [body.catagory]: { $exists: false },
      },
      { $set: { [body.catagory]: [] } },
    );

    if (!result.matchedCount) {
      return res.status(409).json({ error: "Category already exists" });
    }

    res.json({ message: "Inserted successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const updateCatagory = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = {};

    const data = req.body;

    if (data.catagory !== undefined)
      body.catagory = String(data.catagory).trim().toUpperCase();
    if (data.target_catagory !== undefined)
      body.target_catagory = String(data.target_catagory).trim().toUpperCase();

    if (!body.catagory || !body.target_catagory) {
      return res.status(400).json({ error: "catagory and target_catagory are required" });
    }

    const result = await collection.updateOne(
      {
        _id: new ObjectId(SKILLS_ID),
        [body.target_catagory]: { $exists: true },
      },
      { $rename: { [body.target_catagory]: body.catagory } },
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const removeCatagory = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = {};

    const data = req.body.catagory;

    if (data !== undefined) body.catagory = String(data).trim().toUpperCase();
    // console.log(data);

    const result = await collection.updateOne(
      {
        _id: new ObjectId(SKILLS_ID),
        [body.catagory]: { $exists: true },
      },
      { $unset: { [body.catagory]: "" } },
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Deleted successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const addSkill = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = req.body;
    const skillCtgory = String(body.catagory ?? "").trim().toUpperCase();
    const name = String(body.name ?? "").trim();

    if (!skillCtgory || !name) {
      return res.status(400).json({ error: "catagory and name are required" });
    }

    const data = {
      ID: new ObjectId(),
      name,
      desc: String(body.desc ?? "").trim(),
      url: String(body.url ?? "").trim(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(SKILLS_ID), [skillCtgory]: { $exists: true } },
      { $push: { [skillCtgory]: data } },
    );

    if (!result.modifiedCount) {
      return res.status(404).json({ error: "Skill category not found" });
    }

    res.json({ message: "Updated successfully", result: { ID: data.ID } });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const removeSkill = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const db = getDB();
    const collection = db.collection("portfolio");
    const body = req.body;
    const skillID = asId(body.ID);
    const skillCatagory = String(body.catagory ?? "").trim().toUpperCase();
    if (!skillID || !skillCatagory) {
      throw new Error("Missing data field");
    }

    const result = await collection.updateOne(
      {
        _id: new ObjectId(SKILLS_ID),
        [skillCatagory]: { $exists: true },
      },
      { $pull: { [skillCatagory]: { ID: skillID } } },
    );

    if (!result.modifiedCount) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json({ message: "removed successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const updateSkill = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body;
    const skillID = asId(body.ID);
    const skillCatagory = String(body.catagory ?? "").trim().toUpperCase();

    if (!skillID || !skillCatagory) {
      return res.status(400).json({ error: "catagory and ID are required" });
    }

    const patch = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.desc !== undefined) patch.desc = String(body.desc).trim();
    if (body.url !== undefined) patch.url = String(body.url).trim();

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const set = {};
    for (const [key, value] of Object.entries(patch)) {
      set[`${skillCatagory}.$[skill].${key}`] = value;
    }

    const db = getDB();
    const collection = db.collection("portfolio");
    const result = await collection.updateOne(
      { _id: new ObjectId(SKILLS_ID), [skillCatagory]: { $elemMatch: { ID: skillID } } },
      { $set: set },
      { arrayFilters: [{ "skill.ID": skillID }] },
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json({ message: "Updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const addExperience = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const db = getDB();
    const collection = db.collection("portfolio");

    const body = req.body;
    const title = String(body.title ?? "").trim();
    const catagory = String(body.catagory ?? "").trim();
    const date = String(body.date ?? "").trim();

    if (!title || !catagory || !date) {
      return res.status(400).json({ error: "title, date and catagory are required" });
    }

    const data = {
      id: String(new ObjectId()),
      title,
      desc: String(body.desc ?? "").trim(),
      date,
      catagory,
      url: String(body.url ?? "").trim(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(EXP_ID) },
      { $push: { exp: data } },
    );

    if (!result.modifiedCount) {
      return res.status(404).json({ error: "experience not updated" });
    }

    res.json({ message: "Updated successfully", result: { id: data.id } });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const readExperience = async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("portfolio");

    const result = await collection.findOne(
      {
        _id: new ObjectId(EXP_ID),
      },
      { projection: { exp: 1, _id: 0 } },
    );

    if (!result) {
      return res.status(404).json({ error: "Experience document not found" });
    }
    res.json(result.exp || []);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const updateExperience = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body;
    const entryId = String(body.id ?? "").trim();
    if (!entryId) {
      return res.status(400).json({ error: "id is required" });
    }

    const patch = {};
    for (const key of ["title", "desc", "date", "catagory", "url"]) {
      if (body[key] !== undefined) patch[`exp.$.${key}`] = String(body[key]).trim();
    }

    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const db = getDB();
    const collection = db.collection("portfolio");
    const result = await collection.updateOne(
      { _id: new ObjectId(EXP_ID), "exp.id": entryId },
      { $set: patch },
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: "Experience entry not found" });
    }

    res.json({ message: "Updated successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const entryId = String(req.body?.id ?? req.query?.id ?? "").trim();
    if (!entryId) {
      return res.status(400).json({ error: "id is required" });
    }

    const db = getDB();
    const collection = db.collection("portfolio");
    const result = await collection.updateOne(
      { _id: new ObjectId(EXP_ID) },
      { $pull: { exp: { id: entryId } } },
    );

    if (!result.modifiedCount) {
      return res.status(404).json({ error: "Experience entry not found" });
    }

    res.json({ message: "Deleted successfully", result });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
