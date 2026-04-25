exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const messages = body.messages || [];

    if (!messages.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No messages provided" }),
      };
    }

    // Get latest user message
    const userMessage = messages[messages.length - 1].content;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: userMessage }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // Extract response safely
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    // Return in Claude-compatible format (so frontend works)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        role: "assistant",
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || "Something went wrong",
      }),
    };
  }
};
