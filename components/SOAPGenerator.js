"use client";  // ✅ Required for React Hooks

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SOAPGenerator() {
    console.log("✅ SOAPGenerator is rendering!");

    const [input, setInput] = useState({
        signalment: "",
        history: "",
        clinicalFindings: "",
        assessment: "",
        plan: "",
    });
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const isDark = localStorage.getItem("darkMode") === "true";
        setDarkMode(isDark);
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        localStorage.setItem("darkMode", !darkMode);
    };

    const handleChange = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResponse("");

        try {
            const res = await fetch("/api/generate-soap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            if (!res.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await res.json();
            setResponse(data.soapNote || "No response from server.");
        } catch (error) {
            console.error("Error fetching SOAP note:", error);
            setResponse("Error generating SOAP note.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-green-200 to-blue-100"} flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-300`}>
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-2xl rounded-2xl p-10 w-full max-w-3xl border border-gray-200 transition-all duration-300`}>
                {/* Dark Mode Toggle Button */}
                <button 
                    onClick={toggleDarkMode} 
                    className="absolute top-5 right-5 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 shadow-md hover:scale-110 transition-all"
                >
                    {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
                </button>

                <motion.h1 
                    className="text-5xl font-extrabold text-blue-700 text-center mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    📝 VetFusionAI SOAP Notes
                </motion.h1>
                <motion.p 
                    className="text-lg text-gray-600 text-center mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    Enter patient details below, and AI will generate a SOAP note formatted for veterinarians.
                </motion.p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {["signalment", "history", "clinicalFindings", "assessment", "plan"].map((field, index) => (
                        <motion.div 
                            key={field} 
                            className="mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2, duration: 0.5 }}
                        >
                            <label className="block text-lg font-medium text-gray-800 dark:text-gray-300 capitalize">
                                {field.replace(/([A-Z])/g, " $1").trim()}:
                            </label>
                            <textarea
                                className="mt-2 p-3 border border-gray-300 rounded-xl w-full text-black bg-white shadow-sm focus:ring focus:ring-blue-300 transition-all dark:bg-gray-700 dark:text-white"
                                rows="2"
                                name={field}
                                placeholder={`Enter ${field}...`}
                                value={input[field]}
                                onChange={handleChange}
                            />
                        </motion.div>
                    ))}
                    <motion.button
                        type="submit"
                        className="w-full py-3 mt-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                    >
                        {loading ? "Generating..." : "Generate SOAP Note"}
                    </motion.button>
                </form>

                {response && (
                    <motion.div 
                        className="mt-8 bg-gray-50 p-6 border border-gray-300 rounded-xl shadow-lg dark:bg-gray-800"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">📝 Generated SOAP Note</h2>
                        <pre className="text-gray-700 mt-4 whitespace-pre-wrap font-mono p-4 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-white">
                            {response}
                        </pre>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

