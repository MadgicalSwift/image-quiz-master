// chatbot.module.ts

import { Module } from '@nestjs/common';
import {ChatbotService} from './chatbot.service';
import { SwiftchatModule } from 'src/swiftchat/swiftchat.module'; // Correct the import path as necessary
import IntentClassifier from '../intent/intent.classifier';
import { UserService } from 'src/model/user.service';
import { SwiftchatMessageService } from 'src/swiftchat/swiftchat.service';
import { MessageService } from 'src/message/message.service';
import { MockUserService } from 'src/model/mockuser.service';
import { HttpModule } from '@nestjs/axios';
import { FeedbackService } from './feedback.service';  // Adjust path as necessary

@Module({
  imports: [SwiftchatModule, HttpModule], // Import SwiftchatModule
  providers: [
    ChatbotService,
    IntentClassifier,
    FeedbackService,
    {
      provide: UserService,
      useClass: MockUserService,
    },
    {
      provide: MessageService,
      useClass: SwiftchatMessageService,
    },
    FeedbackService,
    FeedbackService,
  ],
  exports: [ChatbotService, IntentClassifier, FeedbackService],
})
export class ChatbotModule {}
