import { Injectable } from '@nestjs/common';
import { dynamoDBClient } from 'src/config/database-config.service';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';
const { USERS_TABLE } = process.env;

@Injectable()
export class UserService {



  async createUser(
    mobileNumber: string,
    language: string,
    botID: string,
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(
        mobileNumber,
        botID,
      );
      if (existingUser) {
        existingUser.language = language;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      } else {
        const newUser = {
          id: uuidv4(),
          mobileNumber: mobileNumber,
          language: language,  // Use the language passed to the function
          Botid: botID,
          button_response: null,
          currentQuestIndex: null,
          currentTopic: null,
          setNumber: null,
          score: null,
        };
        const params = {
          TableName: USERS_TABLE,
          Item: newUser,
        };
        await dynamoDBClient().put(params).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }


  async setUserPreferredLanguage(
    mobileNumber: string,
    language: string,
    botID: string,
  ): Promise<void> {
    const user = await this.findUserByMobileNumber(mobileNumber, botID);
    if (user) {
      user.language = language;
      const setLanguage = {
        TableName: USERS_TABLE,
        Item: user,
      };
      await dynamoDBClient().put(setLanguage).promise();
    } else {
      const newUser = {
        TableName: USERS_TABLE,
        Item: {
          id: uuidv4(),
          mobileNumber,
          language: 'English',
          Botid: botID,
          button_response: null,
          currentQuestIndex: null,
          currentTopic: null,
          setNumber: null,
          score: null,
        },
      };
      await dynamoDBClient().put(newUser).promise();
    }
  }

  async saveQuestIndex(
    mobileNumber: string,
    botID?: string,
    currentQuestIndex?:number
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(
        mobileNumber,
        botID,
      );
      if (existingUser) {
        existingUser.currentQuestIndex = currentQuestIndex;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      } else {
        const newUser = {
          TableName: USERS_TABLE,
          Item: {
            mobileNumber,
            currentQuestIndex: currentQuestIndex,
          },
        };
        await dynamoDBClient().put(newUser).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in createUser:', error);
    }
  }


  

  async saveCurrentSetNumber(
    mobileNumber: string,
    botID?: string,
    setNumber?:number
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(
        mobileNumber,
        botID,
      );
      if (existingUser) {
        existingUser.setNumber = setNumber;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      } else {
        const newUser = {
          TableName: USERS_TABLE,
          Item: {
            mobileNumber,
            setNumber: setNumber,
          },
        };
        await dynamoDBClient().put(newUser).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in saveCurrentSetNumber:', error);
    }
  }


  async saveCurrentTopic(
    mobileNumber: string,
    botID?: string,
    topic?:number
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(
        mobileNumber,
        botID,
      );
      if (existingUser) {
        existingUser.currentTopic = topic;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      } else {
        const newUser = {
          TableName: USERS_TABLE,
          Item: {
            mobileNumber,
            currentTopic: topic,
          },
        };
        await dynamoDBClient().put(newUser).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in saveCurrentTopic:', error);
    }
  }


  async saveCurrentScore(
    mobileNumber: string,
    botID?: string,
    score?:number
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(
        mobileNumber,
        botID,
      );
      if (existingUser) {
        existingUser.score = score;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      } else {
        const newUser = {
          TableName: USERS_TABLE,
          Item: {
            mobileNumber,
            score: score,
          },
        };
        await dynamoDBClient().put(newUser).promise();
        return newUser;
      }
    } catch (error) {
      console.error('Error in saveCurrentScore:', error);
    }
  }







  
  async findUserByMobileNumber(mobileNumber, Botid) {
    try {
      console.log(mobileNumber, Botid)
      const params = {
        TableName: USERS_TABLE,
        KeyConditionExpression: 'mobileNumber = :mobileNumber and Botid = :Botid',
        ExpressionAttributeValues: {
          ':mobileNumber': mobileNumber,
          ':Botid': Botid,
        },
      };
      const result = await dynamoDBClient().query(params).promise();
      return result.Items?.[0] || null; // Return the first item or null if none found
    } catch (error) {
      console.error('Error querying user from DynamoDB:', error);
      return null;
    }
  }

  
}
