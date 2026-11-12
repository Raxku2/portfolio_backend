import crypto from "crypto";

/*
  ImageKit helpers.
  - Uploads happen in the browser (frontend -> ImageKit) using short-lived auth
    params generated here, so the private key never leaves the server.
  - Deletions happen here, where the private key lives.
*/
const publicKey = () => process.env.IK_PUBKEY || "";
const privateKey = () => process.env.IK_PRIKEY || "";
const urlEndpoint = () => process.env.IK_ENDPOINT || "";

export const isImageKitConfigured = () =>
  Boolean(publicKey() && privateKey() && urlEndpoint());

export const getUploadAuthParams = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes
  const signature = crypto
    .createHmac("sha1", privateKey())
    .update(token + expire)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey: publicKey(),
    urlEndpoint: urlEndpoint(),
  };
};

/*
  Removes a file from the ImageKit media library.
  Returns true when the file is gone (or already missing).
*/
export const deleteImageKitFile = async (fileId) => {
  if (!fileId || !isImageKitConfigured()) return false;

  try {
    const res = await fetch(
      `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(`${privateKey()}:`).toString("base64")}`,
        },
      },
    );

    if (!res.ok && res.status !== 404) {
      console.warn("[imagekit] delete failed:", res.status);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[imagekit] delete error:", error.message);
    return false;
  }
};
