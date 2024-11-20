import request from "supertest";
import { app } from "../app.js";
import * as userQueries from "../prisma/userQueries.js";
import { jest } from "@jest/globals";
import { body, validationResult } from "express-validator";

jest.mock("../prisma/userQueries.js");

describe("USER ROUTER TEST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe("POST /register", () => {
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
  });
});
