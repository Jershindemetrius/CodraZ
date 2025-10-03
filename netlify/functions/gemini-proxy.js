// You'll need to install the Google Generative AI client library:
// npm install @google/generative-ai
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { prompt } = JSON.parse(event.body);

  // IMPORTANT: Access the API key from Netlify environment variables
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error('GEMINI_API_KEY is not set in Netlify environment variables!');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server configuration error: API key missing.' }),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or "gemini-1.5-flash", "gemini-1.5-pro" etc.

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to get response from Gemini AI.', error: error.message }),
    };
  }
};
