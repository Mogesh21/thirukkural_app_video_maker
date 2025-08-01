import { createCanvas, registerFont } from "canvas";
import path from "path";
import fs from "fs";

function wrapText(ctx, text, fontSize, maxWidth, fontFamily = "Tamil", fontWeight = "normal") {
  try {
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;

    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && line !== "") {
        lines.push(line.trim());
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }

    if (line.trim() !== "") {
      lines.push(line.trim());
    }

    return lines;
  } catch (err) {
    throw err;
  }
}

const createTextImage = (filePath, data, options = {}) => {
  try {
    const width = 1080;
    const height = 1080;
    const leftPadding = 60;
    const fontSize = options.fontSize || 38;
    const lineHeight = (fontSize * 3) / 2;
    const fontPath1 = path.join(process.cwd(), "assets", "fonts", "tamil.ttf");
    const fontPath2 = path.join(process.cwd(), "assets", "fonts", "tamil-bold.ttf");

    registerFont(fontPath1, { family: "Tamil" });
    registerFont(fontPath2, { family: "TamilBold" });

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, width, height);

    const adhikaram = "அதிகாரம் : " + data.kural_adhi_number;
    const title = data.kural_pal;
    const kuralHeader = "குறள் எண் - " + data.kural_no;
    const line1 = data.kural_line_one;
    const line2 = data.kural_line_two;
    const explanationHeader = "குறள் விளக்கம்";
    const explanationLines = wrapText(ctx, data.explanation, fontSize, width - leftPadding * 2);
    const author = "- " + data.author;

    ctx.fillStyle = options.color || "#ffffff";
    ctx.textAlign = "left";

    ctx.font = `bold ${fontSize + 4}px "TamilBold"`;
    ctx.textAlign = "center";
    ctx.fillText(adhikaram, canvas.width / 2, 100);
    ctx.fillText(title, canvas.width / 2, 170);

    ctx.textAlign = "left";
    ctx.font = `${fontSize + 1}px "TamilBold"`;
    ctx.fillText(kuralHeader, leftPadding, 280);

    let textSize = fontSize;
    ctx.font = `${textSize}px "Tamil"`;
    let totalWidth = ctx.measureText(line1).width;
    let maxWidth = width - leftPadding * 2;
    while (totalWidth > maxWidth) {
      textSize -= 1;
      ctx.font = `${textSize}px "Tamil"`;
      totalWidth = ctx.measureText(line1).width;
    }

    // ctx.font = `${textSize}px "Tamil"`;
    ctx.fillText(line1, leftPadding, 280 + lineHeight);
    ctx.fillText(line2, leftPadding, 280 + lineHeight * 2);

    ctx.font = `${fontSize + 1}px "TamilBold"`;
    ctx.fillText(explanationHeader, leftPadding, 560);

    ctx.font = `${fontSize}px "Tamil"`;
    explanationLines.forEach((line, index) => {
      ctx.fillText(line, leftPadding, 560 + lineHeight + index * lineHeight);
    });

    ctx.textAlign = "right";
    ctx.font = `${fontSize + 1}px "TamilBold"`;
    const startY = (explanationLines.length + 1) * lineHeight + 600;
    ctx.fillText(author, canvas.width - leftPadding, startY);

    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    throw err;
  }
};

export default createTextImage;
