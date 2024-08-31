// swiftchat.module.ts

import { Module } from '@nestjs/common';
import { SwiftchatMessageService } from './swiftchat.service';
import { MessageModule } from 'src/message/message.module'; // Correct the import path as necessary
import { MixpanelService } from 'src/mixpanel/mixpanel.service';

@Module({
  imports: [MessageModule], // Import MessageModule
  providers: [SwiftchatMessageService, MixpanelService],
  exports: [SwiftchatMessageService],
})
export class SwiftchatModule {}
