export default async function handler(req, res) {
  try {
    const { input } = req.body;

    const prompt = `
Bertindaklah sebagai content creator profesional.

Buat 5 variasi konten:
1. Storytelling
2. FOMO
3. Problem-Solution
4. Curiosity
5. Social Proof

Produk:
${input}

Gunakan Bahasa Indonesia santai, singkat, dan persuasif.
Akhiri dengan CTA.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    res.status(200).json({
      result: data.choices[0].message.content
    });

  } catch (error) {
    res.status(500).json({ error: "Terjadi error" });
  }
}
