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
  createTextImage(overlayImage, data, { color });

  const video_name = `${data.kural_no}-${data.author_id}.mp4`;
  const output = formatPath(path.join(videoDir, video_name));

  // Get actual audio duration
  const audioDuration = await getAudioDuration(audio);
  const duration = Math.ceil(audioDuration);

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(bg_image)
      .inputOptions(["-loop 1"])
      .input(audio)
      .input(overlayImage)
      .complexFilter([
        "[0:v] scale=1080:1080:force_original_aspect_ratio=disable,setdar=1 [bg]",
        "[2:v] scale=1080:1080,crop=1080:1080:0:0 [overlay]",
        "[bg][overlay] overlay=0:0 [merged]",
        "[merged] pad=1080:1920:0:(oh-ih)/2:black,trim=duration=" +
          duration +
          ",setpts=PTS-STARTPTS [v]",
      ])
      .outputOptions([
        "-map [v]",
        "-map 1:a",
        "-c:v libx264",
        "-c:a aac",
        "-pix_fmt yuv420p",
        "-shortest",
        "-async 1",
        "-r 30",
        "-movflags faststart",
        "-tune stillimage",
        "-fflags +genpts",
      ])
      .save(output)
      .on("end", () => {
        console.log("✅ Video created:", video_name);
        resolve(output);
      })
      .on("error", (err) => {
        err.name = "Video Error";
        console.error("❌ FFmpeg Error:", err.message);
        reject(err);
      });
  });

  fs.rmSync(tempDir, { recursive: true });
  return video_name;
};

export default generateVideo;
