const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt } = JSON.parse(event.body);

  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Prompt is required' }) };
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: Gemini API Key missing.' }),
    };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  // --- CHANGE MADE HERE ---
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
  // If "gemini-1.0-pro" still gives issues, try "text-bison-001" (an older text-only model)
  // const model = genAI.getGenerativeModel({ model: "text-bison-001" });
  // --- END CHANGE ---

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to get response from Gemini AI', error: error.message }),
    };
  }
}; // Added the missing closing curly brace for the exports.handler function
