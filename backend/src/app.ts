import cors from "cors";
import express from "express";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "5mb" }));

export default app;
