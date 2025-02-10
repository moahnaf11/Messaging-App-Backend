import request from "supertest";
import { app } from "../app.js";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import * as messageQueries from "../prisma/messageQueries.js";
import * as cloudinaryConfig from "../utils/cloudinaryConfig.js";
import multer from "multer";
import * as helperfunctions from "../utils/helperfunctions.js";
jest.mock("../utils/helperfunctions.js");
jest.mock("../prisma/messageQueries.js");
jest.mock("../utils/cloudinaryConfig.js");

describe("MESSAGE ROUTER TEST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("POST /message", () => {
    it("should post a new message without any media", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      messageQueries.uploadMessage.mockResolvedValue({
        message: "hello",
      });
      const response = await request(app)
        .post("/message")
        .set("Authorization", "Bearer mytoken")
        .send({
          receiverId: "12",
          content: "hello",
        });

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        message: "hello",
      });
    });

    it("should return an error if receiverId is missing", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      messageQueries.uploadMessage.mockResolvedValue({
        message: "hello",
      });
      const response = await request(app)
        .post("/message")
        .set("Authorization", "Bearer mytoken")
        .send({
          content: "hello",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Sender and receiver IDs / group chat IDs are required.");
    });
    it("should return an error if id is missing", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { username: "testuser" }); // Simulate a valid user object
      });

      messageQueries.uploadMessage.mockResolvedValue({
        message: "hello",
      });
      const response = await request(app)
        .post("/message")
        .set("Authorization", "Bearer mytoken")
        .send({
          content: "hello",
          receiverId: "12",
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Sender and receiver IDs / group chat IDs are required.");
    });
  });

  describe("POST /message/media", () => {
    it("should post message with media", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      cloudinaryConfig.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve) => {
          // Call the middleware function, passing in the req, res, and a success callback
          fn(req, res, (result) => {
            resolve(result); // Resolve the promise indicating success
          });
        });
      });
      messageQueries.uploadMessageWithMedia.mockResolvedValueOnce({
        id: "messageId",
        content: "Hello",
      });

      cloudinaryConfig.handleUpload.mockResolvedValueOnce({
        url: "http://example.com/image1",
      });
      const response = await request(app)
        .post("/message/media")
        .attach("media", Buffer.from("dummy content"), "photo.jpg") // Valid file
        .field("receiverId", "456")
        .field("content", "Hello")
        .set("Authorization", "Bearer mockToken");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ id: "messageId", content: "Hello" });
      expect(cloudinaryConfig.handleUpload).toHaveBeenCalled();
      expect(messageQueries.uploadMessageWithMedia).toHaveBeenCalled();
    });

    it("should return error if id is not present", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { username: "testuser" }); // Simulate a valid user object
      });
      cloudinaryConfig.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve) => {
          // Call the middleware function, passing in the req, res, and a success callback
          fn(req, res, (result) => {
            resolve(result); // Resolve the promise indicating success
          });
        });
      });
      const response = await request(app)
        .post("/message/media")
        .attach("media", Buffer.from("dummy content"), "photo.jpg") // Valid file
        .field("receiverId", "456")
        .field("content", "Hello")
        .set("Authorization", "Bearer mockToken");
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Sender and receiver IDs/ group chat IDs are required.");
    });

    it("should return error if receiverId is not present", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      cloudinaryConfig.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve) => {
          // Call the middleware function, passing in the req, res, and a success callback
          fn(req, res, (result) => {
            resolve(result); // Resolve the promise indicating success
          });
        });
      });
      const response = await request(app)
        .post("/message/media")
        .attach("media", Buffer.from("dummy content"), "photo.jpg") // Valid file
        .field("content", "Hello")
        .set("Authorization", "Bearer mockToken");
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("Sender and receiver IDs/ group chat IDs are required.");
    });

    it("should handle invalid file size error", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      cloudinaryConfig.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve, reject) => {
          // Simulate the middleware behavior
          const error = new multer.MulterError("LIMIT_FILE_SIZE");
          // Simulate the middleware rejecting with an error
          return reject(error);
        });
      });

      const response = await request(app)
        .post("/message/media")
        .attach("media", Buffer.from("dummy content"), "photo.jpg")
        .set("Authorization", "Bearer mockToken");

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("File size exceeds the limit of 2MB.");
    });

    it("should handle file count error", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      cloudinaryConfig.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve, reject) => {
          // Simulate the middleware behavior
          const error = new multer.MulterError("LIMIT_FILE_COUNT");
          // Simulate the middleware rejecting with an error
          reject(error);
        });
      });

      const response = await request(app)
        .post("/message/media")
        .attach("media", Buffer.from("dummy content"), "photo.jpg")
        .set("Authorization", "Bearer mockToken");

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("You can only upload up to 5 files.");
    });

    it("should handle invalid file type error", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      cloudinaryConfig.runMiddleware = jest.fn((req, res, fn) => {
        return new Promise((resolve, reject) => {
          // Simulate the middleware behavior
          const error = {
            message:
              "Invalid file type. Only JPEG, JPG, PNG, MP4, PDF and DOCX allowed",
          };
          // Simulate the middleware rejecting with an error
          reject(error);
        });
      });

      const response = await request(app)
        .post("/message/media")
        .attach("media", Buffer.from("dummy content"), "photo.jpg")
        .set("Authorization", "Bearer mockToken");

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        "Invalid file type. Only JPEG, JPG, PNG, MP4, PDF and DOCX allowed"
      );
    });
  });

  describe("DELETE /message", () => {
    it("should delete a message with media", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      const mockMessage = {
        media: [
          { type: "image", public_id: "img_1" },
          { type: "video", public_id: "vid_1" },
          { type: "raw", public_id: "raw_1" },
        ],
      };

      // Mock the dependencies
      messageQueries.getMessage.mockResolvedValue(mockMessage);
      messageQueries.delMessage.mockResolvedValue({
        messageId: "123",
        status: "deleted",
      });
      helperfunctions.deleteImageFromCloudinary.mockResolvedValue(true);
      helperfunctions.deleteVideoFromCloudinary.mockResolvedValue(true);
      helperfunctions.deleteRawFromCloudinary.mockResolvedValue(true);

      const response = await request(app)
        .delete("/message/123")
        .set("Authorization", "Bearer mockToken");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        messageId: "123",
        status: "deleted",
      });

      // Check that the deletion functions were called
      expect(helperfunctions.deleteImageFromCloudinary).toHaveBeenCalledWith([
        "img_1",
      ]);
      expect(helperfunctions.deleteVideoFromCloudinary).toHaveBeenCalledWith([
        "vid_1",
      ]);
      expect(helperfunctions.deleteRawFromCloudinary).toHaveBeenCalledWith([
        "raw_1",
      ]);
      expect(messageQueries.delMessage).toHaveBeenCalledWith("123");
    });

    it("should delete a message without media and return a success response", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      const mockMessage = {
        media: [],
      };

      // Mock the dependencies
      messageQueries.getMessage.mockResolvedValue(mockMessage);
      messageQueries.delMessage.mockResolvedValue({
        messageId: "123",
        status: "deleted",
      });

      const response = await request(app)
        .delete("/message/123")
        .set("Authorization", "Bearer mockToken");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        messageId: "123",
        status: "deleted",
      });

      // Ensure no cloudinary deletion functions are called
      expect(helperfunctions.deleteImageFromCloudinary).not.toHaveBeenCalled();
      expect(helperfunctions.deleteVideoFromCloudinary).not.toHaveBeenCalled();
      expect(helperfunctions.deleteRawFromCloudinary).not.toHaveBeenCalled();
      expect(messageQueries.delMessage).toHaveBeenCalledWith("123");
    });
  });

  describe("PUT /message", () => {
    it("should update a message", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      messageQueries.editMessage.mockResolvedValue({});

      const response = await request(app)
        .put("/message/123")
        .send({
          content: "hi updated",
        })
        .set("Authorization", "Bearer mockToken");

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({});
    });

    it("should return error if failed to edit message", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      messageQueries.editMessage.mockResolvedValue(null);

      const response = await request(app)
        .put("/message/123")
        .send({
          content: "hi updated",
        })
        .set("Authorization", "Bearer mockToken");

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("failed to edit message");
    });

    it("should call editMessage with correct arguments", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      messageQueries.editMessage.mockResolvedValue({});

      const response = await request(app)
        .put("/message/123")
        .send({
          content: "hi updated",
        })
        .set("Authorization", "Bearer mockToken");

      expect(messageQueries.editMessage.mock.calls[0][0]).toBe("123");
      expect(messageQueries.editMessage.mock.calls[0][1]).toBe("hi updated");
    });
  });
});
