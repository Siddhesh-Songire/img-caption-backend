import express from "express";
import OpenAI from "openai";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import "dotenv/config";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(bodyParser.json());

const openai = new OpenAI({
  organization: process.env.ORG,
  apiKey: process.env.API_KEY,
});

app.get("/", (req, res) => {
  res.send("<p>Server is running</p>");
});

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
    console.error("Query Error:", error); // Log any errors
    throw error; // Rethrow the error to handle it in the route handler
  }
}

// ...

app.post("/", async (req, res) => {
  try {
    const ans = await query("./sample1.jpg");
    console.log("Image Analysis Result:", ans); // Log the analysis result

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

    console.log("Chat Completion Result:", chatCompletion); // Log the chat completion result

    console.log(chatCompletion.choices[0].message.content);
    res.json({
      chatCompletion: chatCompletion.choices[0].message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Your server is running on PORT ${process.env.PORT}`)
);
