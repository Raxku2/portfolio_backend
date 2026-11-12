import { getDB } from "./db.js";
const ROOT_KEY = process.env.ROOT_KEY;

export const validateAdmin = async (email) => {
  if (!email || !ROOT_KEY) return false;

  const userColl = getDB().collection("user");
  const user = await userColl.findOne(
    { email: String(email).trim() },
    { projection: { key: 1, _id: 0 } },
  );

  return Boolean(user) && user.key === ROOT_KEY;
};
