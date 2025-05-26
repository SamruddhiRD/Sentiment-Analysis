async function fetchSummary(file, user_input, sessionId, streamCallback, retryCount = 0) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_input", user_input);
    formData.append("session_id", sessionId);
  
    const response = await fetch("http://127.0.0.1:8000/chatbot", {
      method: "POST",
      body: formData,
    });
    if (response.status === 429) {
      if (retryCount < 3) {
        console.warn("⚠️ Rate limit hit. Retrying in 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return fetchSummary(file, user_input, sessionId, streamCallback, retryCount + 1);
      } else {
        throw new Error("Too many retries. Try again later.");
      }
    }
    if (!response.ok || !response.body) {
      throw new Error("Failed to fetch summary");
    }
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = "";
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, { stream: true });
      accumulatedText += chunk;
  
      if (streamCallback) {
        streamCallback(chunk);
      }
    }
  
    return accumulatedText;
  }
  
  export default fetchSummary;