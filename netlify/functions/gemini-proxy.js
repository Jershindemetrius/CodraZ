const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  // Get the prompt from the request body
  const { prompt } = JSON.parse(event.body);

  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Prompt is required' }),
    };
  }

  // !!! IMPORTANT: Get your API key from environment variables !!!
  // You will set this in Netlify's UI under Site settings > Build & deploy > Environment variables
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: Gemini API Key missing.' }),
    };
  }

  // Initialize the Generative AI client
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro for text generation

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }), // Send the AI's response text back to the client
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Failed to get response from Gemini AI', error: error.message }),
    };
  }
};