export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { system, prompt } = req.body;

  const fullSystem = system + " Keep each section to 3-4 sentences maximum. Be sharp, specific and concise. No long paragraphs.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        system: fullSystem,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error(JSON.stringify(data));
    res.status(200).json({ result: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
