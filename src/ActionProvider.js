import { v4 as uuidv4 } from "uuid";
import fetchSummary from "./fetchSummary";

class ActionProvider {
  constructor(createChatBotMessage, setState) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setState;
    this.isProcessing = false;

    let storedSessionId = localStorage.getItem("session_id");
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem("session_id", storedSessionId);
    }
    this.sessionId = storedSessionId;
  }

  handleFileUpload = (file) => {
    if (!file) {
      this.setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          this.createChatBotMessage("❗ No file detected. Please upload a file."),
        ],
      }));
      return;
    }

    console.log("📂 File uploaded:", file.name);

    this.setState((prev) => ({
      ...prev,
      fileUploaded: true,
      uploadedFile: file,
      messages: [
        ...prev.messages,
        this.createChatBotMessage(`✅ File uploaded: "${file.name}". Please enter your query.`),
      ],
    }));
  };

  setUserMessage = (message) => {
    if (!message.trim()) {
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages, this.createChatBotMessage("❗ Please enter a valid query.")],
      }));
      return;
    }

    this.setState((prev) => {
      if (!prev.fileUploaded) {
        return {
          ...prev,
          messages: [
            ...prev.messages,
            this.createChatBotMessage("❗ Please upload a file before sending a query."),
          ],
        };
      }

      if (!this.isProcessing) {
        this.isProcessing = true;
        this.handleFileProcessing(prev.uploadedFile, message);
      }

      return {
        ...prev,
        userMessage: message,
      };
    });
  };

  handleFileProcessing = async (file, message) => {
    console.log("📤 Sending request to backend...");

    const processingMsg = this.createChatBotMessage("⏳ Processing...");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, processingMsg],
    }));

    try {
      const fullResponse = await fetchSummary(file, message, this.sessionId);

      // Format response into bullet points
      const lines = fullResponse
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const formatted = ["🤖 AI Response:"]
        .concat(lines.map((line) => `• ${line}`))
        .join("\n");

      const finalMessage = this.createChatBotMessage(formatted);

      this.setState((prev) => {
        const messagesWithoutProcessing = prev.messages.filter(
          (msg) => msg.message !== "⏳ Processing..."
        );
        return {
          ...prev,
          messages: [...messagesWithoutProcessing, finalMessage],
        };
      });
    } catch (error) {
      console.error("❌ Error during processing:", error);
      this.setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          this.createChatBotMessage("❌ Something went wrong. Please try again."),
        ],
      }));
    } finally {
      this.isProcessing = false;
    }
  };
}
export default ActionProvider;