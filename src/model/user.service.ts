import { Injectable } from '@nestjs/common';
import { dynamoDBClient } from 'src/config/database-config.service';
import { User } from './user.entity';
import { v4 as uuidv4 } from 'uuid';
import { dummyUsers } from 'src/config/dummy';
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
          name:null,
          isNameRequired:false,
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

  async updateIsNameRequired(
    mobileNumber: string,
    botID: string,
    isNameRequired: boolean
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(mobileNumber, botID);
      if (existingUser) {
        existingUser.isNameRequired = isNameRequired;
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      }
    } catch (error) {
      console.error('Error updating isNameRequired:', error);
      throw error;
    }
  }

  async saveUserName(
    mobileNumber: string,
    botID: string,
    name: string
  ): Promise<User | any> {
    try {
      const existingUser = await this.findUserByMobileNumber(mobileNumber, botID);
      if (existingUser) {
        existingUser.name = name;
        existingUser.isNameRequired = false; // Mark name as collected
        const updateUser = {
          TableName: USERS_TABLE,
          Item: existingUser,
        };
        await dynamoDBClient().put(updateUser).promise();
        return existingUser;
      }
    } catch (error) {
      console.error('Error saving user name:', error);
      throw error;
    }
  }

async getTopStudents(Botid: string, topic: string, setNumber: number): Promise<User[] | any> {
  try {
      const params = {
          TableName: USERS_TABLE,
          KeyConditionExpression: 'Botid = :Botid',
          ExpressionAttributeValues: {
              ':Botid': Botid,
          },
      };
      const result = await dynamoDBClient().query(params).promise();

      const users = result.Items || [];
    
      const filteredUsers = users.filter(user => user.Botid === Botid);
    
      if (filteredUsers.length === 0) {
          return [];  
      }

      filteredUsers.forEach(user => {
          user['totalScore'] = 0;  

          if (user.challenges && Array.isArray(user.challenges)) {
              console.log("User's challenges:", JSON.stringify(user.challenges, null, 2));  
              user.challenges.forEach(challenge => {
                  if (challenge.topic === topic) {
                      if (challenge.question && Array.isArray(challenge.question)) {
                          challenge.question.forEach(question => {
                              if (Number(question.setNumber) === Number(setNumber) && question.score != null) {
                                  user['totalScore'] += question.score;  
                              } else {
                                  console.log(`No match for setNumber or score is missing: setNumber ${question.setNumber}, score ${question.score}`);
                              }
                          });
                      } else {
                          console.log(`No questions found or questions is not an array for user ${user.mobileNumber}`);
                      }
                  } else {
                      console.log(`Topic does not match for user ${user.mobileNumber}: ${challenge.topic} != ${topic}`);
                  }
              });
          } else {
              console.log(`User ${user.mobileNumber} has no challenges or challenges is not an array.`);
          }
      });

      const topUsers = filteredUsers
          .filter(user => user['totalScore'] > 0)  
          .sort((a, b) => b['totalScore'] - a['totalScore']) 
          .slice(0, 3);  
      return topUsers;
  } catch (error) {
      console.error('Error retrieving top students:', error);
      throw error;
  }
}

  async saveUserChallenge(mobileNumber: string, botID: string, challengeData: any): Promise<any> {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        mobileNumber: mobileNumber,
        Botid: botID
      },
      UpdateExpression: 'SET challenges = list_append(if_not_exists(challenges, :emptyList), :challengeData)',
      ExpressionAttributeValues: {
        ':challengeData': [challengeData], 
        ':emptyList': []
      }
    };

    try {
      await dynamoDBClient().update(params).promise();
      console.log(`User challenge data updated for ${mobileNumber}`);
    } catch (error) {
      console.error('Error saving challenge data:', error);
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
