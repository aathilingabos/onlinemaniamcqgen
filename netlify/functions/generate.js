exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Allow only POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
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
    const apiResponse = await fetch(
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

    const data = await apiResponse.json();

    console.log("Gemini raw response:", JSON.stringify(data));

    // Safe extraction (NO CRASH GUARANTEED)
    let text = "Sorry, no response generated.";

    if (
      data &&
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0 &&
      data.candidates[0].content.parts[0].text
    ) {
      text = data.candidates[0].content.parts[0].text;
    }

    // Always return frontend-safe format
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
    console.error("Function error:", error);

    return {
      statusCode: 200, // still 200 to avoid frontend crash
      headers,
      body: JSON.stringify({
        role: "assistant",
        content: [
          {
            type: "text",
            text: "⚠️ Server error. Please try again.",
          },
        ],
      }),
    };
  }
};
