import * as natural from 'natural';
import { localisedStrings } from 'src/i18n/en/localised-strings';

class IntentClassifier {
  classify(text: any) {
    throw new Error('Method not implemented.');
  }
  private classifier: natural.BayesClassifier;
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.trainClassifier();
  }
  private trainClassifier() {
    this.classifier.addDocument('Hi', 'greeting');
    
    this.classifier.train();
  }

  private getEntities(intent: string, message: string): string[] {
    if (intent === 'greeting') {
      if (localisedStrings.language_hindi.indexOf(message)) {
        return ['hindi'];
      } else {
        return ['english'];
      }
    }
  }
  public getIntent(message: string): { intent: string; entities: string[] } {
    const intent = this.classifier.classify(message);
    const entities = this.getEntities(intent, message);
    return {
      intent: intent,
      entities: entities,
    };
  }
}
export default IntentClassifier;
