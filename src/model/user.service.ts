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
          isNameRequired:true,
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

  async getTopStudents(botId: string, topic: string, setNumber: number): Promise<User[] | any> {
    try {
        const params = {
            TableName: USERS_TABLE,
            ProjectionExpression: '#name, mobileNumber, Botid, challenges,isNameRequired, score, setNumber', // Use an alias 
            ExpressionAttributeNames: {
                '#name': 'name' // Map the alias "#nm" to the actual attribute "name"
            }
        };

        const result = await dynamoDBClient().scan(params).promise();
        const resultKeys = Object.keys(result).slice(0, 5);
        
        const users = result.Items || [];
        console.log("5 users:",users.slice(0,5));

        // Filter users based on botId and mobileNumber
        const filteredUsers = users.filter(user => user.Botid == botId );
        console.log("Filtered: ",filteredUsers);
        if (filteredUsers.length === 0) {
          console.log("No users matched the given Botid.");
          // return [];
      }
      if(!filteredUsers[0].challenges){
        console.error("Users missing expected fields:", filteredUsers);
      }

        // Calculate total score for each user based on the given topic and set number
        filteredUsers.forEach(user => {
            user.totalScore = 0;
            if (user.challenges && Array.isArray(user.challenges)) {
                user.challenges.forEach(challenge => {
                    if (challenge.topic === topic) {
                        if (challenge.question && Array.isArray(challenge.question)) {
                            challenge.question.forEach(question => {
                                if (Number(question.setnumber) === Number(setNumber) && question.score != null) {
                                    user.totalScore += question.score; // Sum up scores for the matching set number
                                }
                            });
                        }
                    }
                });
            }
            else {
              console.log(`User ${user.mobileNumber} has no challenges or challenges is not an array.`);
          }
        });

        // Sort by total score in descending order and get the top 3 users
        const topUsers = filteredUsers.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);

        return topUsers;
    } catch (error) {
        console.error('Error retrieving top students:', error);
        throw error;
    }
}


// async  getTopStudents(botId: string, topic: string, setNumber: number): Promise<User[] | any> {
//     try {
//         // Use the dummy dataset instead of fetching from DynamoDB
//         const users = dummyUsers;

//         // Log first 5 users (in this case, it'll log the full dummy dataset)
//         console.log("First 5 users:", users.slice(0, 5));

//         // Filter users based on botId
//         const filteredUsers = users.filter(user => user.Botid === botId);
//         console.log("Filtered Users by botId:", filteredUsers);

//         if (filteredUsers.length === 0) {
//             console.log("No users matched the given Botid.");
//             return [];
//         }

//         // Check if users have challenges
//         if (!filteredUsers[0].challenges) {
//             console.error("Users missing expected fields:", filteredUsers);
//             return [];
//         }

//         // Calculate total score for each user based on the given topic and set number
//         filteredUsers.forEach(user => {
//           user['totalScore'] = 0;
//             if (user.challenges && Array.isArray(user.challenges)) {
//                 user.challenges.forEach(challenge => {
//                     if (challenge.topic === topic) {
//                         if (challenge.question && Array.isArray(challenge.question)) {
//                             challenge.question.forEach(question => {
//                                 if (Number(question.setnumber) === Number(setNumber) && question.score != null) {
//                                     user['totalScore'] += question.score; // Sum up scores for the matching set number
//                                 }
//                             });
//                         }
//                     }
//                 });
//             } else {
//                 console.log(`User ${user.mobileNumber} has no challenges or challenges is not an array.`);
//             }
//         });

//         // Sort by total score in descending order and get the top 3 users
//         const topUsers = filteredUsers.sort((a, b) => b['totalScore'] - a['totalScore']).slice(0, 3);
//         console.log("Top 3 Users:", topUsers);

//         return topUsers;
//     } catch (error) {
//         console.error('Error retrieving top students:', error);
//         throw error;
//     }
//   }


  async saveUserChallenge(mobileNumber: string, botID: string, challengeData: any): Promise<any> {
    const params = {
      TableName: USERS_TABLE,
      Key: {
        mobileNumber: mobileNumber,
        Botid: botID
      },
      UpdateExpression: 'SET challenges = list_append(if_not_exists(challenges, :emptyList), :challengeData)',
      ExpressionAttributeValues: {
        ':challengeData': [challengeData], // Appends the new challenge data to the challenges array
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
