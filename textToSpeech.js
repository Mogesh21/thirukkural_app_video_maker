import gTTS from "gtts";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

const OUTPUT_DIR = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const generateSpeech = (text, index) => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(OUTPUT_DIR, `part_${index}.mp3`);
    const gtts = new gTTS(text, "ta", { timeout: 60000 });
    gtts.save(filepath, (err) => {
      if (err) return reject(err);
      resolve(filepath);
    });
  });
};

// const concatAudios = (inputs, output) => {
//   const fileListPath = path.join(OUTPUT_DIR, "filelist.txt");
//   const fileList = inputs.map((f) => `file '${f}'`).join("\n");
//   fs.writeFileSync(fileListPath, fileList);

//   return new Promise((resolve, reject) => {
//     ffmpeg()
//       .input(fileListPath)
//       .inputOptions("-f", "concat", "-safe", "0")
//       .outputOptions("-c", "copy")
//       .save(output)
//       .on("end", () => resolve(output))
//       .on("error", (err) => {
//         console.log("FFmpeg audio Error", err);
//         reject;
//       });
//   });
// };

const concatAudios = (inputs, output) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    inputs.forEach((input) => {
      command.input(input);
    });

    command
      .on("end", () => resolve(output))
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .outputOptions([
        "-filter_complex",
        `concat=n=${inputs.length}:v=0:a=1`,
        "-acodec",
        "libmp3lame",
      ])
      .save(output);
  });
};

const tamilTextToSpeech = async (textArray, filename) => {
  try {
    const files = [];
    const silenceFile = path.join(process.cwd(), "assets", "audio", `silence.mp3`);

    for (let i = 0; i < textArray.length; i++) {
      const speechFile = await generateSpeech(textArray[i], i);
      files.push(speechFile);

      if (i < textArray.length - 1) {
        files.push(silenceFile);
      }
    }

    const outputPath = path.join(OUTPUT_DIR, filename);
    await concatAudios(files, outputPath);
    return outputPath;
  } catch (err) {
    console.error("❌ Error during TTS generation:", err);
    throw err;
  }
};

export default tamilTextToSpeech;
