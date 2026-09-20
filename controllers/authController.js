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
    
    let result = await collection.findOne({'email':googleUser.email});
    
    if (!result){
      result = await collection.insertOne({
        "email":googleUser.email,
        "name":googleUser.name,
        "dp":googleUser.picture
      });
      result._id = result.insertedId;
    }else{
      await collection.updateOne({"email":googleUser.email},{$set:{"dp":googleUser.picture}});
    } 
    console.log(result);

    const simpleSessionId = Math.random().toString(36).substring(2, 15);

    // 2. Encode the user's name so spaces and special characters don't break the HTTP headers
    const safeName = encodeURIComponent(googleUser.name);

    // 3. Ensure the base URL is clean and doesn't rely on trailing slashes in your .env
    // We remove any accidental trailing slashes from FRONT_END_URL, then explicitly add "/login"
    const finalRedirectUrl = `${FRONT_END_URL}/login?uid=${new String(result._id)}&session=${simpleSessionId}&name=${safeName}`;

    // D. Step 5: Redirect back to the frontend
    res.redirect(finalRedirectUrl);
  } catch (error) {
    console.error("Auth error:", error);
    res.send("Authentication failed");
  }
};
