import express from "express";
import cors from "cors";
import reportsRouter from "./jobs/job.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Server running");
});

// Job-based crawl/report API (see docs/ARCHITECTURE.md §3).
app.use("/api/reports", reportsRouter);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
