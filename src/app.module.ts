import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DeepseekController } from './controllers/deepseek.controller';
import { DeepseekService } from './services/deepseek.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, DeepseekController],
  providers: [AppService, DeepseekService],
})
export class AppModule {}
