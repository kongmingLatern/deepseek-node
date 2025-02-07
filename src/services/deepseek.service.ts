import {
  ChatCompletionChunk,
  Message,
  SimpleChatRequest,
} from '../types/deepseek.types';
import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';
import { DeepseekConfig } from '../config/deepseek.config';
import OpenAI from 'openai';
import axios from 'axios';

@Injectable()
export class DeepseekService {
  private baseURL: string;
  private openai: OpenAI;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    this.baseURL = DeepseekConfig.baseURL;
    const apiKey = this.request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new Error('Deepseek API key is not provided in request header');
    }

    this.openai = new OpenAI({
      baseURL: this.baseURL,
      apiKey: apiKey,
    });
  }

  private getHeaders() {
    const apiKey = this.request.headers['x-api-key'] as string;
    return {
      Authorization: `Bearer ${apiKey}`,
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
      const stream = await this.openai.chat.completions.create({
        ...chatRequest,
        stream: true,
      });

      // 处理流式响应
      for await (const chunk of stream) {
        try {
          onChunk(chunk as ChatCompletionChunk);
        } catch (e) {
          console.error('处理流式数据块失败:', e);
        }
      }

      return stream;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.error ||
          'Failed to get streaming chat completion',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
