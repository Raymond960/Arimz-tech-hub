import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminInvitationRoutes from "./routes/adminInvitation.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "Shendam Connect Backend",
    status: "online"
  });
});

app.use("/api/admin/invitations", adminInvitationRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

app.use((error: any, _req: any, res: any, _next: any) => {
  console.error("UNHANDLED SERVER ERROR:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error."
  });
});

export default app;
