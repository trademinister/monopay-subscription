import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import monoRoutes from "./routes/mono.route";
import shopifyRoutes from "./routes/shopify.route";
import { HOSTNAME, PORT } from "./config";
import { initializeCronTasksFromDB } from "./functions/cron";

const app = express();
const port = PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/mono", monoRoutes);
app.use("/auth", shopifyRoutes);

app.listen(port, async () => {
  try {
    await initializeCronTasksFromDB();
    console.log(`✅ Server running at http://${HOSTNAME}:${PORT}`);
  } catch (error) {
    console.log(error);
  }
});
