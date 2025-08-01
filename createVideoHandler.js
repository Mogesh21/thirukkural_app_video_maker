import generateVideo from "./createVideo.js";

const keys = ["8c9c6bb93daab2910bca8e7b2625aaa0c5b5824603381f0953fd8abd93636bb5"];

const images = [
  {
    bg_image: "1.png",
    color: "#3c1308",
  },
  {
    bg_image: "2.png",
    color: "#fff9f7",
  },
  {
    bg_image: "3.png",
    color: "#581d09",
  },
  {
    bg_image: "4.png",
    color: "#581d09",
  },
  {
    bg_image: "5.png",
    color: "#581d09",
  },
  {
    bg_image: "6.png",
    color: "#000000",
  },
  {
    bg_image: "7.png",
    color: "#461606",
  },
  {
    bg_image: "8.png",
    color: "#461606",
  },
  {
    bg_image: "9.png",
    color: "#000000",
  },
  {
    bg_image: "10.png",
    color: "#fdbb12",
  },
];

export const createVideo = async (req, res) => {
  try {
    const key = req.headers.key;
    if (!key) {
      return res.status(401).json({
        message: "key is required",
      });
    } else if (!keys.includes(key)) {
      return res.status(401).json({
        message: "invalid key",
      });
    }
    const data = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({
        message: "data must be an array",
      });
    }

    const videos = [];
    console.log("\nProcess started");
    console.log("----------------------------");
    console.log(`Total Videos = ${data.length}`);
    for (let i = 0; i < data.length; i++) {
      // const randomItem = images[0];
      const randomItem = images[Math.floor(Math.random() * images.length)];

      const video_name = await generateVideo(data[i], randomItem.bg_image, randomItem.color);

      if (video_name)
        videos.push({
          kural_no: data[i].kural_no,
          author_id: data[i].author_id,
          video_name: video_name,
          video_path: "public/videos/" + video_name,
        });
    }
    console.log("----------------------------");
    console.log("video generated successfully");
    return res.status(200).json({
      videos: videos,
      message: "Videos created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
