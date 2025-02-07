export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessageOptions {
  isCache: boolean;
}

export interface SimpleChatRequest {
  messages: ChatMessage[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature: number;
  max_tokens: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    delta: Partial<ChatMessage>;
    finish_reason: string | null;
  }[];
}
