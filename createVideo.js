import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import createTextImage from "./createImage.js";
import tamilTextToSpeech from "./textToSpeech.js";

const formatPath = (filePath) => filePath.replace(/\\/g, "/");

// Get audio duration with ffprobe
const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

const generateVideo = async (data, image, color) => {
  const videoDir = path.join(process.cwd(), "public", "videos");
  const tempDir = path.join(process.cwd(), "public", "temp");
  const imageDir = path.join(process.cwd(), "assets", "images");

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  const audioName = `${data.kural_no}-${data.author_id}.mp3`;
  const bg_image = formatPath(path.join(imageDir, image));
  const audio = formatPath(path.join(tempDir, audioName));

  const adhikaram = "அதிகாரம் : " + data.kural_adhi_number;
  const title = data.kural_pal;
  const line1 = data.kural_line_one;
  const line2 = data.kural_line_two;
  const explanations = data.explanation;
  const author = data.author;

  const audioText = [adhikaram, title, line1 + " " + line2, explanations, author];
  await tamilTextToSpeech(audioText, audioName);

  const overlayImage = path.join(tempDir, "text.png");
  await createTextImage(overlayImage, data, { color });

  const temp_name = `${data.kural_no}-${data.author_id}-tmp.mp4`;
  const video_name = `${data.kural_no}-${data.author_id}.mp4`;
  const temp_output = formatPath(path.join(videoDir, temp_name));
  const output = formatPath(path.join(videoDir, video_name));

  // Get actual audio duration
  const audioDuration = await getAudioDuration(audio);
  const duration = Math.ceil(audioDuration);

  await new Promise((resolve, reject) => {
    try {
      ffmpeg()
        .input(bg_image)
        .inputOptions(["-loop 1"])
        .input(audio)
        .input(overlayImage)
        .inputOptions(["-loop 1"])
        .complexFilter([
          {
            filter: "scale",
            options: { w: 1080, h: 1080, force_original_aspect_ratio: "disable" },
            inputs: "0:v",
            outputs: "bg",
          },
          {
            filter: "setdar",
            options: "1",
            inputs: "bg",
            outputs: "bg2",
          },
          {
            filter: "scale",
            options: { w: 1080, h: 1080 },
            inputs: "2:v",
            outputs: "overlay_scaled",
          },
          {
            filter: "crop",
            options: { w: 1080, h: 1080, x: 0, y: 0 },
            inputs: "overlay_scaled",
            outputs: "overlay",
          },
          {
            filter: "overlay",
            options: { x: 0, y: 0 },
            inputs: ["bg2", "overlay"],
            outputs: "merged",
          },
          {
            filter: "pad",
            options: { w: 1080, h: 1920, x: 0, y: "(oh-ih)/2", color: "black" },
            inputs: "merged",
            outputs: "padded",
          },
          {
            filter: "setpts",
            options: "PTS-STARTPTS",
            inputs: "padded",
            outputs: "v",
          },
        ])
        .outputOptions([
          "-map [v]",
          "-map 1:a",
          "-c:v libx264",
          "-tune stillimage",
          "-c:a aac",
          "-b:a 192k",
          "-pix_fmt yuv420p",
          "-shortest",
          "-r 30",
        ])
        .save(temp_output)
        .on("end", () => {
          console.log("✅ Video created:", video_name);
          resolve(temp_output);
        })
        .on("error", (err) => {
          err.name = "Video Error";
          console.error("❌ FFmpeg Error:", err.message);
          reject(err);
        });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });

  await new Promise((resolve, reject) => {
    ffmpeg(temp_output)
      .setStartTime(0)
      .setDuration(parseInt(duration))
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions("-pix_fmt yuv420p")
      .save(output)
      .on("end", () => {
        console.log("Video successfully trimmed to", duration, "seconds.");
        resolve(output);
      })
      .on("error", (err) => {
        console.error("Error during trimming:", err.message);
        reject(err);
      });
  });

  fs.rmSync(tempDir, { recursive: true });
  return video_name;
};

export default generateVideo;
