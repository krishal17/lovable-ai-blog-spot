
export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  if (!file) return null;
  
  try {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "krishal");
    data.append("cloud_name", "dgfuwtqbk");

    const res = await fetch("https://api.cloudinary.com/v1_1/dgfuwtqbk/image/upload", {
      method: "POST",
      body: data
    });
    
    if (!res.ok) {
      throw new Error(`Upload failed with status: ${res.status}`);
    }
    
    const result = await res.json();
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
};
