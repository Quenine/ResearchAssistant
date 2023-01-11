const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send({ message: "Hello from ResearchAssistant" }));

app.post("/", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    let history = req.body.history || [];
    if (prompt.toLowerCase().startsWith("debug")) {
      const code = prompt.substring("debug".length).trim();
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `${code}\n${prompt}`,
        temperature: 0.5,
        max_tokens: 3000,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0,
      });
      res.status(200).send({ bot: response.data.choices[0].text });
    } else if (history.length > 0 && prompt.toLowerCase().startsWith("history")) {
      const index = parseInt(prompt.substring("history".length).trim());
      res.status(200).send({ bot: history[index] });
    } else if (prompt.toLowerCase().startsWith("explain")) {
      const topic = prompt.substring("explain".length).trim();
      const explanation = await generateDetailedExplanation(topic);
      res.status(200).send({ bot: explanation.text, image: explanation.image });
    } else {
      history.push(prompt);
      const response = await generateResponseWithHistory(prompt, history);
      res.status(201).send({ bot: response });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error || "Something went wrong");
  }
});

app.listen(5000, () => console.log("AI server started on http://localhost:5000"));

async function generateResponseWithHistory(context, history) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `${context}\n${history.join("\n")}`,
    temperature: 0.5,
    max_tokens: 3000,
  });
  return response.data.choices[0].text;
}

