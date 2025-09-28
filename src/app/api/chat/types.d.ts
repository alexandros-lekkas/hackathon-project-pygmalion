export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: Message[];
}

export interface ChatResponse {
  response: string;
}

export interface ChatError {
  error: string;
  details?: any;
}
