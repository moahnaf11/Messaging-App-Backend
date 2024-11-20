import request from "supertest";
import { app } from "../app.js";
import * as userQueries from "../prisma/userQueries.js";
import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import passport from "passport";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

jest.mock("../prisma/userQueries.js");
jest.mock("nodemailer");

describe("USER ROUTER TEST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("POST /users/register", () => {
    it("should return 400 status with error array when form validation fails", async () => {
      const response = await request(app).post("/users/register").send({
        firstname: "",
        lastname: "",
        username: "sh", // Invalid username
        email: "invalid-email", // Invalid email
        password: "123", // Too short
        confirmpassword: "1234", // Doesn't match
      });

      const errorMessages = response.body.error.map((err) => err.msg);

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toHaveLength(6);
    });

    it("should return status 400 if user already exists in the database with the email and password", async () => {
      userQueries.addUser.mockResolvedValue({
        error: "email already exists",
      });

      const response = await request(app).post("/users/register").send({
        firstname: "Mohammad",
        lastname: "Ahnaf",
        username: "mo_ahnaf11",
        email: "ahnaf@gmail.com",
        password: "123456",
        confirmpassword: "123456",
      });
      expect(userQueries.addUser.mock.calls.length).toBe(1);
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe("email already exists");
    });

    it("should return status 201 if user added to database successfully", async () => {
      userQueries.addUser.mockResolvedValue({
        user: "Ahnaf",
      });

      const response = await request(app).post("/users/register").send({
        firstname: "Mohammad",
        lastname: "Ahnaf",
        username: "mo_ahnaf11",
        email: "ahnaf@gmail.com",
        password: "123456",
        confirmpassword: "123456",
      });

      expect(response.statusCode).toBe(201);
      expect(response.body).toStrictEqual({
        user: "Ahnaf",
      });
    });
  });

  describe("POST /users/login", () => {
    it("should return error and status 400 if login form validation fails", async () => {
      const response = await request(app).post("/users/login").send({
        username: "12",
        password: "124",
      });

      const errorMessages = response.body.error.map((err) => err.msg);
      expect(response.body.error).toHaveLength(2);
      expect(response.body.error.map((err) => err.msg)).toStrictEqual(
        errorMessages
      );
      expect(response.statusCode).toBe(400);
    });

    it("should successfully login user if credentials are correct and send 200 status", async () => {
      passport.authenticate = jest.fn((strategy, callback) => {
        return (req, res, next) => {
          // Simulate successful login
          callback(
            null,
            { id: 1, username: "testuser", email: "test@example.com" },
            null
          );
        };
      });

      jwt.sign = jest.fn().mockReturnValue("my token");
      const response = await request(app).post("/users/login").send({
        username: "mo_ahnaf11",
        password: "123456",
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, username: "testuser", email: "test@example.com" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({ token: "my token" });
    });

    it("should fail to login user if username / password is incorrect and return 401 status and error message", async () => {
      passport.authenticate = jest.fn((strategy, callback) => {
        return (req, res, next) => {
          // Simulate failed login
          callback(null, false, { message: "Invalid username or password" });
        };
      });

      const response = await request(app).post("/users/login").send({
        username: "wronguser",
        password: "wrongpassword",
      });

      expect(response.statusCode).toBe(401); // Unauthorized
      expect(response.body).toStrictEqual({
        error: "Invalid username or password",
      });
    });
  });

  describe("POST /users/forgot-password", () => {
    it("should send a mail when user forgets password", async () => {
      userQueries.getUser.mockResolvedValue({
        id: 1,
        user: "Ahnaf",
      });
      userQueries.updateResetPasswordToken = jest.fn().mockResolvedValue(true);
      const sendMailMock = jest.fn().mockResolvedValue(true);
      nodemailer.createTransport.mockReturnValue({
        sendMail: sendMailMock,
      });
      const response = await request(app).post("/users/forgot-password").send({
        email: "ahnaf@gmail.com",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        message: "Password reset email sent",
      });
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    });
    it("should successfully reset users password", async () => {
      userQueries.getToken.mockResolvedValue({
        user: "Ahnaf",
        id: 1,
      });
      userQueries.updateUserResetToken.mockResolvedValue(true);

      bcrypt.hash = jest.fn().mockResolvedValue("hello");
      const response = await request(app).post("/users/reset-password").send({
        token: "my token",
        newPassword: "123456",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toStrictEqual({
        message: "Password reset successful",
      });
      expect(userQueries.updateUserResetToken).toHaveBeenCalledWith(1, "hello");
      expect(userQueries.getToken).toHaveBeenCalledWith("my token");
      expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);
    });

    it("should return error status if token expires", async () => {
      userQueries.getToken.mockResolvedValue(null);
      const response = await request(app).post("/users/reset-password").send({
        token: "my token",
        newPassword: "123456",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toStrictEqual({
        error: "Invalid or expired token",
      });
    });
  });
});
