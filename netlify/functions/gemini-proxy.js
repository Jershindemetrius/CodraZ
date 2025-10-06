// netlify/functions/gemini-proxy.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Prompt is required' }),
      };
    }

    // Access your API key as an environment variable
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch from Gemini API', error: error.message }),
    };
  }
};


