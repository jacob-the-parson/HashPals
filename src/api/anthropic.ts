/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Anthropic API. You may update this service, but you should not need to.
*/
import Anthropic from "@anthropic-ai/sdk";

export const getAnthropicClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("Anthropic API key not found in environment variables");
  }
  return new Anthropic({
    apiKey: apiKey,
  });
};
