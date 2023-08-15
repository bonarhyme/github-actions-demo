'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const dynamoDbClient = new DynamoDBClient({});

// const DynamoDB = require('aws-sdk/clients/dynamodb');
// const documentClient = new DynamoDB.DocumentClient({
//   region: 'eu-north-1',
//   maxRetries: 3, // 10
//   httpOptions: {
//     timeout: 5000,
//   },
// });

const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
};

module.exports.createNote = async (event, context, cb) => {
  // Always add this to lambda functions to allow a quick response of callbacks to the user.
  context.callbackWaitForEmptyEventLoop = false;

  const data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data?.title,
        body: data?.body,
      },
      ConditionExpression: 'attribute_not_exists(notesId)',
    };

    await dynamoDbClient.send(new PutCommand(params));

    // await documentClient.put(params).promise();

    return send(201, data);
  } catch (error) {
    return send(500, error?.message);
  }
};

module.exports.updateNote = async (event, context, cb) => {
  context.callbackWaitForEmptyEventLoop = false;

  const notesId = event.pathParameters.id;
  const data = JSON.parse(event.body);

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body': 'body',
      },
      ExpressionAttributeValues: {
        ':title': data?.title,
        ':body': data?.body,
      },

      ConditionExpression: 'attribute_exists(notesId)',
    };

    await dynamoDbClient.send(new UpdateCommand(params));
    // await documentClient.update(params).promise();
    return send(200, data);
  } catch (error) {
    return send(500, error?.message);
  }
};

module.exports.deleteNote = async (event, context, cb) => {
  context.callbackWaitForEmptyEventLoop = false;

  const notesId = event.pathParameters.id;

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      ConditionExpression: 'attribute_exists(notesId)',
    };
    await dynamoDbClient.send(new DeleteCommand(params));
    // await documentClient.delete(params).promise();
    return send(200, notesId);
  } catch (error) {
    return send(500, error?.message);
  }
};

module.exports.getAllNotes = async (event, context, cb) => {
  context.callbackWaitForEmptyEventLoop = false;

  try {
    const params = {
      TableName: NOTES_TABLE_NAME,
    };

    const notes = await dynamoDbClient.send(new ScanCommand(params));
    // const notes = await documentClient.scan(params).promise();

    return send(200, notes);
  } catch (error) {
    return send(500, error?.message);
  }
};

// Add
