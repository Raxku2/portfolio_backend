import { validateAdmin } from "../config/admin.js";
import {
  deleteImageKitFile,
  getUploadAuthParams,
  isImageKitConfigured,
} from "../config/imagekit.js";

/*
  Returns the short-lived signature the browser needs to upload straight to
  ImageKit. Admin only, because uploads change public site content.
*/
export const createUploadAuth = async (req, res) => {
  try {
    if (!(await validateAdmin(req.headers.authorization))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!isImageKitConfigured()) {
      return res.status(503).json({ error: "ImageKit is not configured" });
    }

    res.json({ result: getUploadAuthParams() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
  Deletes a file from the media library. Used when a DP / thumbnail is replaced
  or a project is removed. The DB is the source of truth for fileIds.
*/
export const removeUploadedFile = async (req, res) => {
  try {
    if (!(await validateAdmin(req.headers.authorization))) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const fileId = String(req.body?.fileId || "").trim();
    if (!fileId) {
      return res.status(400).json({ error: "fileId is required" });
    }

    const deleted = await deleteImageKitFile(fileId);
    res.json({ message: deleted ? "Deleted successfully" : "Nothing to delete" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
