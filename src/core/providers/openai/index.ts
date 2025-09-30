import OpenAI from "openai";
export default class OpenAiProvider {
  private static client: OpenAI;
  static init() {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    return this.client;
  }
}
