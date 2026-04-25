exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

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
        statusCode: 200,
        headers,
        body: JSON.stringify({
          role: "assistant",
          content: [{ type: "text", text: "No input provided." }],
        }),
      };
    }

    const userMessage = messages[messages.length - 1].content;

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

    console.log("Gemini RAW:", JSON.stringify(data));

    let text = "No response";

    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      text = data.candidates[0].content.parts[0].text;
    }

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
    console.error("ERROR:", error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Server error. Try again.",
          },
        ],
      }),
    };
  }
};
