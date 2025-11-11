/**
 * AI Service for handling rephrase suggestions
 */

const API_ENDPOINT = "https://us-central1-legalease-prod.cloudfunctions.net/api/suggest";

export interface RephraseRequest {
  actionType: "Rephrase";
  text: string;
}

export interface RephraseResponse {
  suggestion: string;
}

export class AIService {
  static async rephraseText(text: string): Promise<string> {
    try {
      const request: RephraseRequest = {
        actionType: "Rephrase",
        text: text.trim()
      };

      console.log("🤖 Sending rephrase request:", request);

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: RephraseResponse = await response.json();
      console.log("✅ Received rephrase response:", data);

      return data.suggestion;
    } catch (error) {
      console.error("❌ Error calling rephrase API:", error);
      throw new Error(`Failed to get AI suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
