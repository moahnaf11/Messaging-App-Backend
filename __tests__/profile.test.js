import request from "supertest";
import { app } from "../app.js";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { getUser } from "../prisma/userQueries.js";
import * as profileQueries from "../prisma/profileQueries.js";
import bcrypt from "bcryptjs";

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
});
