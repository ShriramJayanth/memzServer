import express from "express";
import authRoutes from "./routes/auth.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  credentials:true,
  origin:true,
}));

app.use("/auth", authRoutes);

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});