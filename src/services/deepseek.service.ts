import {
  ChatCompletionChunk,
  Message,
  SimpleChatRequest,
} from '../types/deepseek.types';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { DeepseekConfig } from '../config/deepseek.config';
import OpenAI from 'openai';
import axios from 'axios';

@Injectable()
export class DeepseekService {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly openai: OpenAI;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
    this.baseURL = DeepseekConfig.baseURL;
    this.openai = new OpenAI({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
    });
    if (!this.apiKey) {
      throw new Error('Deepseek API key is not configured');
    }
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private createChatRequest(
    request: SimpleChatRequest,
  ): ChatCompletionCreateParamsNonStreaming {
    return {
      messages: request.messages,
      model: DeepseekConfig.defaultModel,
      temperature: DeepseekConfig.defaultTemperature,
      max_tokens: DeepseekConfig.defaultMaxTokens,
    };
  }

  async chat(request: SimpleChatRequest): Promise<Record<string, any>> {
    try {
      const chatRequest = this.createChatRequest(request);

      const completion = await this.openai.chat.completions.create(chatRequest);

      if (completion) {
        return completion?.choices?.[0].message;
      }

      return {};
    } catch (error) {
      throw new HttpException(
        error.response?.data?.error || 'Failed to get chat completion',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async chatStream(
    request: SimpleChatRequest,
    onChunk: (chunk: ChatCompletionChunk) => void,
  ) {
    try {
      const chatRequest = this.createChatRequest(request);
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          ...chatRequest,
          stream: true,
        },
        {
          headers: this.getHeaders(),
          responseType: 'stream',
        },
      );

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk
          .toString()
          .split('\n')
          .filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as ChatCompletionChunk;
              onChunk(parsed);
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e);
            }
          }
        }
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.error ||
          'Failed to get streaming chat completion',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
