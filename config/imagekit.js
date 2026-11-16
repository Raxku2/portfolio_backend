import ImageKit from "imagekit";

const publicKey = () => process.env.IK_PUBKEY || "";
const privateKey = () => process.env.IK_PRIKEY || "";
const urlEndpoint = () => process.env.IK_ENDPOINT || "";

// Lazy initialization ensures it doesn't crash if process.env is populated after import
let imagekitInstance = null;
const getImageKit = () => {
  if (!imagekitInstance && isImageKitConfigured()) {
    imagekitInstance = new ImageKit({
      publicKey: publicKey(),
      privateKey: privateKey(),
      urlEndpoint: urlEndpoint(),
    });
  }
  return imagekitInstance;
};

export const isImageKitConfigured = () =>
  Boolean(publicKey() && privateKey() && urlEndpoint());

export const getUploadAuthParams = () => {
  const ik = getImageKit();

  // Get base SDK parameters. Fallback to empty strings to mirror original crypto behavior if env vars are missing.
  const authParams = ik
    ? ik.getAuthenticationParameters()
    : { token: "", expire: 0, signature: "" };

  // Crucial: Append publicKey and urlEndpoint to precisely match your original return signature.
  return {
    ...authParams,
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
    await getImageKit().deleteFile(fileId);
    return true;
  } catch (error) {
    // SDK error objects usually expose the status code. 
    // We treat 404 as a success to match your original 'already missing' logic.
    const is404 = error?.statusCode === 404 || error?.message?.includes("404");

    if (is404) {
      return true;
    }

    console.warn("[imagekit] delete failed:", error.message || error);
    return false;
  }
};