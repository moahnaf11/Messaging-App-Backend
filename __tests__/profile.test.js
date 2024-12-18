import request from "supertest";
import { app } from "../app.js";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { getUser } from "../prisma/userQueries.js";
import * as profileQueries from "../prisma/profileQueries.js";
import bcrypt from "bcryptjs";
import * as helperfunctions from "../utils/helperfunctions.js";
import * as cloudinaryfunction from "../utils/cloudinaryConfig.js";

jest.mock("../utils/helperfunctions.js");

jest.mock("../utils/cloudinaryConfig.js");

jest.mock("../prisma/profileQueries.js");
jest.mock("../prisma/userQueries.js");

describe("PROFILE ROUTER TEST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("POST /profile/:id/change-password", () => {
    it("should display error when password form validation fails", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      const response = await request(app)
        .post("/profile/1/change-password")
        .set("Authorization", "Bearer mytoken")
        .send({
          password: "123",
          newpassword: "1234",
          confirmnewpassword: "123456",
        });

      const errorMessages = response.body.error.map((err) => err.msg);
      expect(response.body.error).toHaveLength(3);
      expect(response.statusCode).toBe(400);
      expect(response.body.error.map((err) => err.msg)).toStrictEqual(
        errorMessages
      );
    });

    it("should display error when token not passed", async () => {
      const response = await request(app)
        .post("/profile/1/change-password")
        .set("Authorization", "Bearer ")
        .send({
          password: "123",
          newpassword: "1234",
          confirmnewpassword: "123456",
        });

      expect(response.body.error).toBe("token not present");
      expect(response.statusCode).toBe(401);
    });

    it("should successfully change password when token is valid", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      getUser.mockResolvedValue({
        id: "1",
        firstname: "Mohammad",
      });
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      profileQueries.updateUserPassword.mockResolvedValue({
        id: "3",
        firstname: "Ahnaf",
      });

      const response = await request(app)
        .post("/profile/1/change-password")
        .set("Authorization", "Bearer mytoken")
        .send({
          password: "123456",
          newpassword: "12345678",
          confirmnewpassword: "12345678",
        });

      expect(response.body).toStrictEqual({ id: "3", firstname: "Ahnaf" });
      expect(response.statusCode).toBe(200);
    });

    it("should return error when user does not exist", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      getUser.mockResolvedValue(null);

      const response = await request(app)
        .post("/profile/1/change-password")
        .set("Authorization", "Bearer mytoken")
        .send({
          password: "123456",
          newpassword: "12345678",
          confirmnewpassword: "12345678",
        });

      expect(response.body.error).toBe(
        "couldnt change password, user does not exist"
      );
      expect(response.statusCode).toBe(404);
    });

    it("should return error when old password is incorrect", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      getUser.mockResolvedValue({
        id: "1",
        firstname: "Mohammad",
      });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const response = await request(app)
        .post("/profile/1/change-password")
        .set("Authorization", "Bearer mytoken")
        .send({
          password: "123456",
          newpassword: "12345678",
          confirmnewpassword: "12345678",
        });

      expect(response.body.error).toBe("Enter your current password");
      expect(response.statusCode).toBe(400);
    });

    it("should call updateUserPassword with correct arguments", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      getUser.mockResolvedValue({
        id: "1",
        firstname: "Mohammad",
      });
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      bcrypt.hash = jest.fn().mockResolvedValue("hashedpassword");

      const response = await request(app)
        .post("/profile/1/change-password")
        .set("Authorization", "Bearer mytoken")
        .send({
          password: "123456",
          newpassword: "12345678",
          confirmnewpassword: "12345678",
        });

      expect(response.statusCode).toBe(200);
      expect(profileQueries.updateUserPassword).toHaveBeenCalledWith(
        "1",
        "hashedpassword"
      );
      expect(profileQueries.updateUserPassword.mock.calls.length).toBe(1);
    });
  });

  describe("PUT /profile/:id/upload-photo", () => {
    it("should successfully upload a photo", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      profileQueries.getProfilePic.mockResolvedValue({ public_id: "123" });
      helperfunctions.deletePhoto.mockResolvedValue(true);
      cloudinaryfunction.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve) => {
          // Call the middleware function, passing in the req, res, and a success callback
          fn(req, res, (result) => {
            resolve(result); // Resolve the promise indicating success
          });
        });
      });
      cloudinaryfunction.handleUpload.mockResolvedValue({
        secure_url: "https://new-url.com/photo.jpg",
        public_id: "new_public_id",
      });
      profileQueries.updateProfilePic.mockResolvedValue({
        id: "user_id",
        profilePic: "https://new-url.com/photo.jpg",
      });

      const response = await request(app)
        .put("/profile/1/upload-photo") // Adjust the route to match your app
        .set("Authorization", "Bearer mytoken")
        .attach("profilepic", Buffer.from("dummy content"), "photo.jpg")
        .set("Content-Type", "multipart/form-data");

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        id: "user_id",
        profilePic: "https://new-url.com/photo.jpg",
      });
    });

    it("should return an error if upload fails cldRes undefined", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      profileQueries.getProfilePic.mockResolvedValue({ public_id: "123" });
      helperfunctions.deletePhoto.mockResolvedValue(true);
      cloudinaryfunction.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve) => {
          // Call the middleware function, passing in the req, res, and a success callback
          fn(req, res, (result) => {
            resolve(result); // Resolve the promise indicating success
          });
        });
      });
      cloudinaryfunction.handleUpload.mockResolvedValue(null);

      const response = await request(app)
        .put("/profile/1/upload-photo") // Adjust the route to match your app
        .set("Authorization", "Bearer mytoken")
        .attach("profilepic", Buffer.from("dummy content"), "photo.jpg")
        .set("Content-Type", "multipart/form-data");

      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE /profile/:id/upload-photo", () => {
    it("should successfully delete users profile photo", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });

      profileQueries.getProfilePic.mockResolvedValue({ public_id: "123" });
      profileQueries.updateProfilePic.mockResolvedValue({
        user: "Ahnaf",
      });

      const response = await request(app)
        .delete("/profile/1/upload-photo") // Adjust the route to match your app
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        user: "Ahnaf",
      });
    });

    it("should return error is profile pic doesn't exist", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });

      profileQueries.getProfilePic.mockResolvedValue(null);
      const response = await request(app)
        .delete("/profile/1/upload-photo") // Adjust the route to match your app
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("no profile pic to delete");
    });
  });

  describe("PUT /profile/:id/online-status", () => {
    it("should update users online status", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      profileQueries.updateOnline.mockResolvedValue({
        user: "Ahnaf",
      });

      const response = await request(app)
        .put("/profile/1/online-status")
        .set("Authorization", "Bearer mytoken")
        .send({
          online: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        user: "Ahnaf",
      });
    });

    it("should return error if user does not exist", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      profileQueries.updateOnline.mockResolvedValue(null);

      const response = await request(app)
        .put("/profile/1/online-status")
        .set("Authorization", "Bearer mytoken")
        .send({
          online: true,
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("failed to update user status");
    });
  });

  describe("GET /profile/:id", () => {
    it("should get users profile", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });

      getUser.mockResolvedValue({ user: "Ahnaf" });
      const response = await request(app)
        .get("/profile/1")
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        user: "Ahnaf",
      });
    });

    it("should return error if user profile does not exist", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });

      getUser.mockResolvedValue(null);
      const response = await request(app)
        .get("/profile/1")
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("user not found");
    });
  });

  describe("PUT /profile/:id", () => {
    it("should update users profile", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      profileQueries.updateUser.mockResolvedValue({ user: "Ahnaf" });

      const response = await request(app)
        .put("/profile/1")
        .set("Authorization", "Bearer mytoken")
        .send({
          firstname: "mohammad",
          lastname: "Ahnaf",
          username: "mo_ahnaf11",
          email: "ahnaf@gmail.com",
          bio: "hi there",
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        user: "Ahnaf",
      });
      expect(profileQueries.updateUser).toHaveBeenCalledWith(
        "1",
        "mohammad",
        "Ahnaf",
        "mo_ahnaf11",
        "ahnaf@gmail.com",
        "hi there"
      );
    });

    it("should return error if failed to update user", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      profileQueries.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .put("/profile/1")
        .set("Authorization", "Bearer mytoken")
        .send({
          firstname: "mohammad",
          lastname: "Ahnaf",
          username: "mo_ahnaf11",
          email: "ahnaf@gmail.com",
          bio: "hi there",
        });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("failed to update user");
    });
  });

  describe("DELETE /profile/:id", () => {
    it("should successfully delete user account", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: "1", username: "testuser" }); // Simulate a valid user object
      });
      const mockUser = {
        public_id: "user_profile_pic_public_id",
        media: [
          { type: "image", public_id: "image1_public_id" },
          { type: "video", public_id: "video1_public_id" },
          { type: "raw", public_id: "raw1_public_id" },
        ],
      };
      getUser.mockResolvedValue(mockUser);
      profileQueries.deleteUserAccount.mockResolvedValue({ user: "Ahnaf" });
      cloudinaryfunction.cloudinary.uploader.destroy.mockResolvedValue({
        result: "ok",
      });
      helperfunctions.deleteImageFromCloudinary = jest
        .fn()
        .mockResolvedValue({ success: true });
      helperfunctions.deleteVideoFromCloudinary = jest
        .fn()
        .mockResolvedValue({ success: true });
      helperfunctions.deleteRawFromCloudinary = jest
        .fn()
        .mockResolvedValue({ success: true });

      const response = await request(app)
        .delete("/profile/1") // Adjust route to match your app
        .set("Authorization", "Bearer mytoken"); // Mock token for authorization

      // Assertions
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ user: "Ahnaf" });

      // Check that the user's profile photo was deleted from Cloudinary
      expect(
        cloudinaryfunction.cloudinary.uploader.destroy
      ).toHaveBeenCalledWith("user_profile_pic_public_id");

      // Check that the media arrays were processed
      expect(helperfunctions.deleteImageFromCloudinary).toHaveBeenCalledWith([
        "image1_public_id",
      ]);
      expect(helperfunctions.deleteVideoFromCloudinary).toHaveBeenCalledWith([
        "video1_public_id",
      ]);
      expect(helperfunctions.deleteRawFromCloudinary).toHaveBeenCalledWith([
        "raw1_public_id",
      ]);

      // Check that the user account was deleted
      expect(profileQueries.deleteUserAccount).toHaveBeenCalledWith("1");
    });
  });
});
