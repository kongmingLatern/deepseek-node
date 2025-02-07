export const DeepseekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
  defaultModel: 'deepseek-chat',
  defaultTemperature: 0.7,
  defaultMaxTokens: 2000,
};
