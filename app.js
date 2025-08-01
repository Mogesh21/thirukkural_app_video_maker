import express from "express";
import ffmpeg from "fluent-ffmpeg";
import cors from "cors";
import path from "path";
import { createVideo } from "./createVideoHandler.js";
import cron from "node-cron";
import { rmSync } from "fs";

const app = express();
// ffmpeg.setFfmpegPath("/bin/ffmpeg");
ffmpeg.setFfmpegPath(`${process.cwd()}/ffmpeg/bin/ffmpeg.exe`);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/ping-me", async (req, res) => res.status(200).json({ message: "active" }));
app.post("/create-video", createVideo);

cron.schedule("0 0 * * *", () => {
  const videoDir = path.join(process.cwd(), "public", "videos");
  rmSync(videoDir, { recursive: true });
});

app.listen(8021, (err) => {
  if (err) console.log(err);
  else console.log("SERVER RUNNING AT 8021");
});
