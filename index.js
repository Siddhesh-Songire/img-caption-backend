import express from "express";
import OpenAI from "openai";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import "dotenv/config";
import fs from "fs";
import multer from "multer";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Set up multer storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = file.originalname.split(".").pop();
    cb(null, uniqueSuffix + "." + fileExtension);
  },
});

const upload = multer({ storage: storage });

const openai = new OpenAI({
  organization: process.env.ORG,
  apiKey: process.env.API_KEY,
});

// app.get("/", (req, res) => {
//   res.send("<p>Server is running</p>");
// });

async function query(filename) {
  try {
    const data = fs.readFileSync(filename);
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/git-large-coco",
      {
        headers: {
          Authorization: "Bearer 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",
        },
        method: "POST",
        body: data,
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
}

// Handle image uploads
app.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const ans = await query(req.file.path);
    console.log("Image Analysis Result:", ans);

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content:
            "Generate 3 social media captions for the given description of the image " +
            JSON.stringify(ans),
        },
      ],
    });

    console.log("Chat Completion Result:", chatCompletion);
    console.log(chatCompletion.choices[0].message.content);

    res.json({
      chatCompletion: chatCompletion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Your server is running on PORT ${process.env.PORT}`)
);
