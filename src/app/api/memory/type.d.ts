export interface ChatRequest {
  message: string;
  history?: Message[];
}

export interface ChatResponse {
  response: string;
}