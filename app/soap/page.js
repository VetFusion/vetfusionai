"use client";
import { useState } from "react";

export default function SOAPGenerator() {
  const [input, setInput] = useState({
    signalment: "",
    history: "",
    clinicalFindings: "",
    assessment: "",
    plan: "",
  });
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    const res = await fetch("/api/generate-soap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await res.json();
    setResponse(data.result);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-blue-600 text-center">📝 VetFusionAI SOAP Notes</h1>
        <p className="mt-4 text-lg text-gray-700 text-center">
          Enter patient details below, and AI will generate a SOAP note formatted for veterinarians.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col">
          {["signalment", "history", "clinicalFindings", "assessment", "plan"].map((field) => (
            <div key={field} className="mb-4">
              <label className="block font-semibold text-gray-800 capitalize">
                {field.replace(/([A-Z])/g, " $1").trim()}:
              </label>
              <textarea
                className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="2"
                name={field}
                placeholder={`Enter ${field}...`}
                value={input[field]}
                onChange={handleChange}
              />
            </div>
          ))}
          <button
            type="submit"
            className="px-6 py-2 mt-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 w-full"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate SOAP Note"}
          </button>
        </form>

        {response && (
          <div className="mt-6 bg-gray-50 p-4 border border-gray-300 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800">📝 Generated SOAP Note</h2>
            <pre className="text-gray-600 mt-2 whitespace-pre-wrap">{response}</pre>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(response);
                  alert("SOAP note copied to clipboard!");
                }}
                className="px-4 py-2 bg-gray-200 text-black rounded-lg font-semibold hover:bg-gray-300"
              >
                📋 Copy to Clipboard
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([response], { type: "application/pdf" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "SOAP_Note.pdf";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                📄 Save as PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
