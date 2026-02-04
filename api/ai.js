import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) return res.status(500).json({ error: "HF_API_KEY not set" });

  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0)
      return res.status(400).json({ error: "Please provide ingredients" });

    const prompt = `
You are an expert Uzbek chef. The user has: ${ingredients.join(", ")}.
Suggest a recipe in JSON format:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "ingredients": ["..."],
  "instructions": ["Step 1...", "Step 2..."],
  "time": "Cooking time",
  "difficulty": "Easy/Medium/Hard"
}
Do NOT add markdown, only JSON.
`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt })
      }
    );

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } 
    catch { return res.status(500).json({ error: "Chef is busy", raw_response: text }); }

    res.status(200).json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chef is busy", details: err.message });
  }
}
