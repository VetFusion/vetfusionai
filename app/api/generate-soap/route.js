import OpenAI from "openai";

export async function POST(req) {
    try {
        const { signalment, history, clinicalFindings, assessment, plan } = await req.json();

        if (!process.env.OPENAI_API_KEY) {
            console.error("❌ OPENAI_API_KEY is missing in environment variables!");
            return new Response(JSON.stringify({ message: "Missing API Key" }), { status: 500 });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are VetFusionAI, an expert in writing veterinary SOAP notes." },
                {
                    role: "user",
                    content: `Generate a SOAP note for this case:\nSignalment: ${signalment}\nHistory: ${history}\nClinical Findings: ${clinicalFindings}\nAssessment: ${assessment}\nPlan: ${plan}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        return new Response(JSON.stringify({ soapNote: response.choices[0].message.content }), { status: 200 });

    } catch (error) {
        console.error("❌ API error:", error);
        return new Response(JSON.stringify({ message: `Error generating SOAP note: ${error.message}` }), { status: 500 });
    }
}

