export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionInput = {
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: "json_object";
};

export class AiConfigurationError extends Error {
  constructor(message = "AI 配置缺失，请配置 AI_BASE_URL、AI_API_KEY 和 AI_MODEL。") {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

export function getAiModel(): string {
  return process.env.AI_MODEL?.trim() ?? "";
}

function getAiConfig() {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = getAiModel();

  if (!baseUrl || !apiKey || !model) {
    throw new AiConfigurationError();
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model,
  };
}

export async function createChatCompletion(
  input: ChatCompletionInput,
): Promise<string> {
  const config = getAiConfig();
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      response_format:
        input.responseFormat === "json_object"
          ? { type: "json_object" }
          : undefined,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string };
        choices?: Array<{ message?: { content?: string } }>;
      }
    | null;

  if (!response.ok) {
    throw new AiProviderError(
      payload?.error?.message ?? `AI 服务请求失败，HTTP ${response.status}。`,
    );
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content || content.trim() === "") {
    throw new AiProviderError("AI 服务返回内容为空。");
  }

  return content.trim();
}
