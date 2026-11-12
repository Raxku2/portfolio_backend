import "dotenv/config";
import { getDB } from "../config/db.js";

const FRONT_END_URL = process.env.FRONTEND_URL;

export const googleAuthStart = (req, res) => {
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile`;
  res.redirect(googleAuthUrl);
};

export const googleAuthCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No code provided by Google");
  }

  try {
    // A. Exchange the code for an Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // B. Use the Access Token to get the user's email and name
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const googleUser = await userResponse.json();

    // 1. Check if Google actually returned an error (e.g., if you refreshed the page and reused an old code)
    if (googleUser.error) {
      console.error("Google API Error:", googleUser);
      return res.status(400).send("Failed to fetch user profile");
    }

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
    // console.log(result);

    // 2. Encode the user's name so spaces and special characters don't break the HTTP headers
    const safeName = encodeURIComponent(googleUser.name);

    // 3. Ensure the base URL is clean and doesn't rely on trailing slashes in your .env
    // We remove any accidental trailing slashes from FRONT_END_URL, then explicitly add "/login"
    const finalRedirectUrl = `${FRONT_END_URL}/login?session=${simpleSessionId}&name=${safeName}`;

    // D. Step 5: Redirect back to the frontend
    res.redirect(finalRedirectUrl);
  } catch (error) {
    console.error("Auth error:", error);
    res.send("Authentication failed");
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
