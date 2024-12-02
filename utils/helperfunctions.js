import { cloudinary } from "./cloudinaryConfig.js";
import { updateProfilePic } from "../prisma/profileQueries.js";

const deletePhoto = async (id, publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  console.log(result);
  if (result.result === "ok") {
    console.log("successfully deleted profile photo from cloudinary");
    const user = await updateProfilePic(id, null, null);
  }
};

// deleting images from cloudinary
const deleteImageFromCloudinary = async (imgArray) => {
  const result = await cloudinary.api.delete_resources(imgArray);
  console.log("deleting images from cloudinary", result);
};

// deleting videos from cloudinary
const deleteVideoFromCloudinary = async (videoArray) => {
  const result = await cloudinary.api.delete_resources(videoArray, {
    resource_type: "video",
  });
  console.log("deleting videos from cloudinary", result);
};

// deleting raw files from cloudinary
const deleteRawFromCloudinary = async (rawArray) => {
  const result = await cloudinary.api.delete_resources(rawArray, {
    resource_type: "raw",
  });
  console.log("deleting raw files from cloudinary", result);
};

export {
  deletePhoto,
  deleteImageFromCloudinary,
  deleteRawFromCloudinary,
  deleteVideoFromCloudinary,
};
