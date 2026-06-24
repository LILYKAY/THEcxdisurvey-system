import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export async function invokeLLM({
  messages,
  response_format,
}: {
  messages: Message[];
  response_format?: ResponseFormat;
}): Promise<{ choices: Array<{ message: { content: string } }> }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    ...(response_format && { response_format }),
    temperature: 0.7,
  });

  return {
    choices: response.choices.map(
      (choice: OpenAI.Chat.ChatCompletion.Choice) => ({
        message: {
          content:
            choice.message.content ||
            "No response generated from OpenAI API",
        },
      })
    ),
  };
}
