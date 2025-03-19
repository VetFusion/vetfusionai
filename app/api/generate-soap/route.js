export async function POST(req) {
    try {
      const body = await req.json();
      const { signalment, history, clinicalFindings, assessment, plan } = body;
  
      const prompt = `
        Generate a SOAP note for a veterinary patient using the following format:
  
        🟢 **Signalment:** ${signalment}
        📜 **History:** ${history}
        🩺 **Clinical Findings:** ${clinicalFindings}
        🔎 **Assessment:** ${assessment}
        ✅ **Plan:** ${plan}
  
        Format the response with **clear headings**, **symbols**, and **visual breaks**.
        Use **professional but readable formatting** for veterinarians.
        Return the note in **Markdown format** for easy styling.
      `;
  
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          prompt: prompt,
          max_tokens: 300,
        }),
      });
  
      const data = await response.json();
      return new Response(JSON.stringify({ result: data.choices[0].text }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to generate SOAP note." }), { status: 500 });
    }
  }
  