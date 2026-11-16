import "dotenv/config";
import { getDB } from "../config/db.js";
import { google } from "googleapis"; // Import the official SDK

const FRONT_END_URL = process.env.FRONTEND_URL;

// Helper function to create a fresh OAuth client for each request
// This prevents race conditions if multiple users log in simultaneously.
const getGoogleClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const googleAuthStart = (req, res) => {
  const oauth2Client = getGoogleClient();

  // The SDK safely generates the URL with the correct formatting and encoding
  const googleAuthUrl = oauth2Client.generateAuthUrl({
    access_type: "online", 
    scope: ["email", "profile"],
  });
  
  res.redirect(googleAuthUrl);
};

export const googleAuthCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No code provided by Google");
  }

  try {
    const oauth2Client = getGoogleClient();

    // A. Exchange the code for tokens (SDK handles the POST request internally)
    const { tokens } = await oauth2Client.getToken(code);
    
    // B. Apply the tokens to our specific client so it knows who is making the next request
    oauth2Client.setCredentials(tokens);

    // C. Fetch the user's profile info (SDK handles Bearer headers and error catching)
    const googleOauth2API = google.oauth2("v2");
    const userResponse = await googleOauth2API.userinfo.get({ auth: oauth2Client });
    
    // The SDK automatically parses the JSON response into the .data property
    const googleUser = userResponse.data;

    // --- YOUR ORIGINAL DATABASE LOGIC STARTS HERE (Unchanged) ---
    const db = getDB();
    const collection = db.collection("user");

    let result = await collection.findOne({ email: googleUser.email });
    const simpleSessionId = Math.random().toString(36).substring(2, 15);

    if (!result) {
      result = await collection.insertOne({
        email: googleUser.email,
        name: googleUser.name,
        dp: googleUser.picture,
        sessionId: simpleSessionId,
      });
      result._id = result.insertedId;
    } else {
      await collection.updateOne(
        { email: googleUser.email },
        { $set: { dp: googleUser.picture, sessionId: simpleSessionId } },
      );
    }
    // --- YOUR ORIGINAL DATABASE LOGIC ENDS HERE ---

    const safeName = encodeURIComponent(googleUser.name);
    const finalRedirectUrl = `${FRONT_END_URL}/login?session=${simpleSessionId}&name=${safeName}`;

    res.redirect(finalRedirectUrl);
  } catch (error) {
    console.error("Google Auth error:", error.message || error);
    res.status(500).send("Authentication failed");
  }
};



export const validateSession = async (req, res) => {
  const sessionId = req.get("sessionId");

  if (!sessionId) {
    res.status(400).send();
    return;
  }
  try {
    const db = getDB();
    const collection = db.collection("user");

    let result = await collection.findOne({ sessionId: sessionId });
    if (!result) {
      res.status(401).send();
      return;
    }

    // Root / admin flag is derived here so the frontend can gate the dashboard;
    // the secret ROOT_KEY itself never leaves the server.
    const isAdmin =
      Boolean(process.env.ROOT_KEY) && result.key === process.env.ROOT_KEY;
    delete result.key;

    // Keep the session valid across refreshes. Only /auth/logout clears it.
    result._id = String(result._id);
    result.isAdmin = isAdmin;
    res.json(result);
  } catch (error) {
    res.json({}).status(500);
  }
};

/*
  Destroys the server-side session so the stored id cannot be reused.
  The frontend clears localStorage before calling this endpoint.
*/
export const logout = async (req, res) => {
  const sessionId = req.get("sessionId");
  if (!sessionId) {
    res.status(204).send();
    return;
  }

  try {
    await getDB()
      .collection("user")
      .updateOne({ sessionId: sessionId }, { $set: { sessionId: "" } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
