import express from "express";
import cors from "cors";
const app = express();
import "dotenv/config";
import { userRouter } from "./routes/userRouter.js";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRouter);

app.use((err, req, res, next) => {
  console.log(err);
  const statusCode = err.status || 500;
  res
    .status(statusCode)
    .json({ error: err.message || "Internal server error" });
});

export { app };
