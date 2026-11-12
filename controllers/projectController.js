import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { validateAdmin } from "../config/admin.js";
import { deleteImageKitFile } from "../config/imagekit.js";

const COLLECTION = "porjects";

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

const text = (value) => String(value ?? "").trim();

// Whitelisted project fields so _id / unknown keys can never be overwritten.
const formatProject = (body = {}) => {
  const doc = {};
  if (body.title !== undefined) doc.title = text(body.title);
  if (body.desc !== undefined) doc.desc = text(body.desc);
  if (body.thumbnal !== undefined) doc.thumbnal = text(body.thumbnal);
  if (body.thumbnal_file_id !== undefined)
    doc.thumbnal_file_id = text(body.thumbnal_file_id);
  if (body.about_line_1 !== undefined)
    doc.about_line_1 = text(body.about_line_1);
  if (body.about_line_2 !== undefined)
    doc.about_line_2 = text(body.about_line_2);
  if (body.about_line_3 !== undefined)
    doc.about_line_3 = text(body.about_line_3);
  if (body.github !== undefined) doc.github = text(body.github);
  if (body.deployment !== undefined) doc.deployment = text(body.deployment);
  if (body.status !== undefined) doc.status = text(body.status).toUpperCase();
  return doc;
};

export const getProjects = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection(COLLECTION).find({}).toArray();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const createProjects = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const doc = formatProject(req.body);
    if (!doc.title) {
      return res.status(400).json({ error: "title is required" });
    }

    const db = getDB();
    const response = await db.collection(COLLECTION).insertOne(doc);

    res.json({ message: "Created successfully", result: { _id: response.insertedId, ...doc } });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const updateProjects = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const targetId = asId(req.params.id ?? req.body?._id);
    if (!targetId) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const doc = formatProject(req.body);
    if (!Object.keys(doc).length) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const db = getDB();
    const collection = db.collection(COLLECTION);
    const current = await collection.findOne({ _id: targetId });
    if (!current) {
      return res.status(404).json({ error: "Project not found" });
    }

    await collection.updateOne({ _id: targetId }, { $set: doc });

    // Replaced thumbnail -> drop the previous upload from ImageKit.
    if (
      current.thumbnal_file_id &&
      doc.thumbnal_file_id !== undefined &&
      doc.thumbnal_file_id !== current.thumbnal_file_id
    ) {
      await deleteImageKitFile(current.thumbnal_file_id);
    }

    const updated = await collection.findOne({ _id: targetId });
    res.json({ message: "Updated successfully", result: updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteProjects = async (req, res) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const targetId = asId(req.params.id ?? req.body?._id ?? req.query?.id);
    if (!targetId) {
      return res.status(400).json({ error: "Invalid project id" });
    }

    const db = getDB();
    const collection = db.collection(COLLECTION);
    const current = await collection.findOne({ _id: targetId });
    if (!current) {
      return res.status(404).json({ error: "Project not found" });
    }

    await collection.deleteOne({ _id: targetId });
    if (current.thumbnal_file_id) {
      await deleteImageKitFile(current.thumbnal_file_id);
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
