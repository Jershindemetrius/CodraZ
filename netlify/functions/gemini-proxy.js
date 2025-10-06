const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    // Check if a prompt was provided
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Prompt is required' }),
      };
    }

    // Initialize the Gemini AI model with your API key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // This line is now correct

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Return the successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    // Log any errors for debugging
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch from Gemini API', error: error.message }),
    };
  }
};

