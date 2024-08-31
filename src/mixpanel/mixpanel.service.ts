import * as Mixpanel from 'mixpanel';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MixpanelService {
  private mixpanel: any;

  constructor() {
    this.mixpanel = Mixpanel.init('c034f05d2a9c0ce678db2b3cfc6fefe9', {
      protocol: 'http',
    });
  }

  public track(eventName: string, action: any = {}): void {
    this.mixpanel.track(eventName, action);
  }
}