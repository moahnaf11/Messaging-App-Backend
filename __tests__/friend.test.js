import request from "supertest";
import { app } from "../app.js";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as friendQueries from "../prisma/friendQueries.js";
import { getUser } from "../prisma/userQueries.js";

jest.mock("../prisma/userQueries");

jest.mock("../prisma/friendQueries.js");

describe("FRIEND ROUTER TEST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("GET /friend", () => {
    it("should return list of all friends", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.getFriends.mockResolvedValue([{}, {}]);
      const response = await request(app)
        .get("/friend")
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([{}, {}]);
    });

    it("should return empty list and 404 status if friends not found", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.getFriends.mockResolvedValue([]);
      const response = await request(app)
        .get("/friend")
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("no friends found");
    });
  });

  describe("POST /friend/request", () => {
    it("should successfully send a friend request", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      getUser.mockResolvedValue({});
      friendQueries.sendPostFriendRequest.mockResolvedValue({});

      const response = await request(app)
        .post("/friend/request")
        .set("Authorization", "Bearer mytoken")
        .send({
          requesteeId: "hi123",
        });
      expect(response.statusCode).toBe(201);
      expect(response.body).toStrictEqual({});
    });

    it("should return error if failed to send friend request", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      getUser.mockResolvedValue(null);

      const response = await request(app)
        .post("/friend/request")
        .set("Authorization", "Bearer mytoken")
        .send({
          requesteeId: "hi123",
        });
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("User not found");
    });
  });

  describe("GET /friend/request", () => {
    it("should get all pending requests", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.getRequests.mockResolvedValue([{}, {}]);
      const response = await request(app)
        .get("/friend/request")
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([{}, {}]);
    });

    it("should return error if no pending requests", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.getRequests.mockResolvedValue([]);
      const response = await request(app)
        .get("/friend/request")
        .set("Authorization", "Bearer mytoken");

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe("no pending friend requests");
    });
  });

  describe("PUT /friend/request/:id", () => {
    it("should accept a friend request", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      friendQueries.updateRequestStatus.mockResolvedValue([]);
      const response = await request(app)
        .put("/friend/request/1")
        .set("Authorization", "Bearer mytoken")
        .send({ handleRequest: "accepted" });

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([]);
    });

    it("should reject a friend request", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      friendQueries.updateRequestStatus.mockResolvedValue([]);
      const response = await request(app)
        .put("/friend/request/1")
        .set("Authorization", "Bearer mytoken")
        .send({ handleRequest: "rejected" });

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([]);
    });

    it("should return error if handleRequest is invalid", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });

      const response = await request(app)
        .put("/friend/request/1")
        .set("Authorization", "Bearer mytoken")
        .send({ handleRequest: "" });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("invalid handleRequest value");
    });
  });

  describe("DELETE /friend/request/:id", () => {
    it("should delete a friend request", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.cancelRequest.mockResolvedValue([]);
      const response = await request(app)
        .delete("/friend/request/1")
        .set("Authorization", "Bearer mytoken");
      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([]);
    });

    it("should return error if failed to delete friend request", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.cancelRequest.mockResolvedValue(null);
      const response = await request(app)
        .delete("/friend/request/1")
        .set("Authorization", "Bearer mytoken");
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("failed to delete the friend request");
    });
  });

  describe("PUT /friend/block/:id", () => {
    it("should block the friend", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.handleBlockUser.mockResolvedValue([]);
      const response = await request(app)
        .put("/friend/request/block/1")
        .set("Authorization", "Bearer mytoken")
        .send({ handleBlock: "blocked" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([]);
    });

    it("should unblock the friend", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.handleBlockUser.mockResolvedValue([]);
      const response = await request(app)
        .put("/friend/request/block/1")
        .set("Authorization", "Bearer mytoken")
        .send({ handleBlock: "accepted" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual([]);
    });

    it("should return error if handleBlock is an invalid value", async () => {
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { id: 1, username: "testuser" }); // Simulate a valid user object
      });
      friendQueries.handleBlockUser.mockResolvedValue([]);
      const response = await request(app)
        .put("/friend/request/block/1")
        .set("Authorization", "Bearer mytoken")
        .send({ handleBlock: "" });
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        "incorrect data type for handleBlock variable"
      );
    });
  });
});
