const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Serve index.html file
  if (req.url === "/" || req.url === "/index.html") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(err);
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (req.url === "/generate" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const { productName, productDescription } = JSON.parse(body);
      // Ürün açıklamasının eksik özelliklerini varsayılan değerlerle doldur
      const filledProductDescription =
        fillProductDescription(productDescription);
      generateContent(
        productName,
        filledProductDescription,
        (generatedText) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ generatedText }));
        },
      );
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Ürün açıklamasının eksik özelliklerini varsayılan değerlerle doldur
function fillProductDescription(productDescription) {
  const defaultValues = {
    benefits: ["improve your life"],
    problem: "No problem description provided",
    solution: "No solution description provided",
    whyToBuy: "No reason provided",
    features: [],
    usageAreas: [],
    tags: [
      "tag1",
      "tag2",
      "tag3",
      "tag4",
      "tag5",
      "tag6",
      "tag7",
      "tag8",
      "tag9",
      "tag10",
      "tag11",
      "tag12",
      "tag13",
    ],
  };
  // Eksik özellikleri doldur
  return { ...defaultValues, ...productDescription };
}

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-pro";
const API_KEY = "AIzaSyA9hrRKZOZfO7U4xICpnac6VCB-anK71Bs";

async function generateContent(productName, productDescription, callback) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [
    {
      text: `You can ${productDescription.benefits[0]} with the ${productName}.`,
    },
    { text: `Problem: ${productDescription.problem}.` },
    { text: `Solution: ${productDescription.solution}.` },
    { text: `Why should I buy this product? ${productDescription.whyToBuy}.` },
    { text: `Benefits and Features:` },
    { text: `* ${productDescription.features.join(", ")}` },
    { text: `Usage Areas:` },
    { text: `* ${productDescription.usageAreas.join(", ")}` },
    { text: `Tags:` },
    { text: `* ${productDescription.tags.join(", ")}` },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  callback(response.text());
}
