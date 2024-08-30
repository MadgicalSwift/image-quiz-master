// chatbot.module.ts

import { Module } from '@nestjs/common';
import {ChatbotService} from './chatbot.service';
import { SwiftchatModule } from 'src/swiftchat/swiftchat.module'; // Correct the import path as necessary
import IntentClassifier from '../intent/intent.classifier';
import { UserService } from 'src/model/user.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import { MessageService } from 'src/message/message.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [SwiftchatModule, HttpModule], // Import SwiftchatModule
  providers: [
    ChatbotService,
    UserService,
    IntentClassifier,
  
    {
      provide: MessageService,
      useClass: SwiftchatMessageService,
    },
   
  ],
  exports: [ChatbotService, IntentClassifier],
})
export class ChatbotModule {}
