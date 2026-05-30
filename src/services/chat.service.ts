import { apiClient } from '../config/axios';

export interface ChatMessage {
  id?: string;
  question: string;
  answer: string; // JSON string representing the data or text response
  template?: string; // template index or category message
  createdAt?: string;
}

export interface ChatHistoryResponse {
  type: string;
  message: string;
  data: {
    history: ChatMessage[];
    isFrozen: boolean;
  };
}

export interface ChatResponse {
  type: string;
  message: string | number; // Gemini template index or message
  data: {
    message?: string;
    list?: Array<{
      id?: string;
      title?: string;
      company?: string;
      description?: string;
      salary?: string;
      location?: string;
      score?: number;
      reasoning?: string;
      suggestions?: string;
    }>;
  };
}

export const chatService = {
  getHistory: async (): Promise<ChatHistoryResponse> => {
    const response = await apiClient.get('/chat-history');
    return response.data;
  },

  sendMessage: async (question: string): Promise<ChatResponse> => {
    const response = await apiClient.post('/chat', { question });
    return response.data;
  }
};
