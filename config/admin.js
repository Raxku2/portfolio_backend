import { getDB } from "./db.js";
const ROOT_KEY = process.env.ROOT_KEY;

export const validateAdmin = async (email) => {
  const userColl = getDB().collection("user");
  const key = await userColl.findOne(
    { email: email },
    { projection: { key: 1, _id: 0 } },
  );
  return key.key === ROOT_KEY;
};
