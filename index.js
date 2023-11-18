import express from "express";
import OpenAI from "openai";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  organization: process.env.ORG,
  apiKey: process.env.API_KEY,
});

// Set up multer to handle image uploads in memory
const upload = multer();

async function query(imageBuffer) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/git-large-coco",
      {
        headers: {
          Authorization: "Bearer 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",
        },
        method: "POST",
        body: imageBuffer,
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Query Error:", error);
    throw error;
  }
}

// Handle image uploads without saving to disk
app.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const ans = await query(req.file.buffer);
    console.log("Image Analysis Result:", ans);

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates social media captions.",
        },
        {
          role: "user",
          content:
            "Generate 3 social media captions for the given description of the image.",
        },
        {
          role: "assistant",
          content: JSON.stringify(ans),
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
