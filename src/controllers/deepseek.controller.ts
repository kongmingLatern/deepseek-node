import { Body, Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DeepseekService } from '../services/deepseek.service';
import { SimpleChatRequest } from '../types/deepseek.types';

@Controller('api/deepseek')
export class DeepseekController {
  constructor(private readonly deepseekService: DeepseekService) {}

  @Post('chat')
  async chat(@Body() request: SimpleChatRequest) {
    return await this.deepseekService.chat(request);
  }

  @Post('chat/stream')
  async chatStream(
    @Body() request: SimpleChatRequest,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    try {
      await this.deepseekService.chatStream(request, (chunk) => {
        response.write(`data: ${JSON.stringify(chunk)}\n\n`);
      });

      response.write('data: [DONE]\n\n');
      response.end();
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Failed to get streaming chat completion',
      });
    }
  }
}
