"use strict";
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-10-08" });
const uuid = require("uuid");
const todosTable = process.env.TODOS_TABLE;

// Create a response
function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message),
  };
}

// Create a todo
module.exports.createTodo = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  if (
    !reqBody.todo ||
    reqBody.todo.trim() === "" ||
    !reqBody.date ||
    reqBody.date.trim() === "" ||
    !reqBody.location ||
    reqBody.location.trim() === "" ||
    !reqBody.description ||
    reqBody.description.trim() === ""
  ) {
    return callback(
      null,
      response(400, {
        error:
          "Todos must have a todo with a date, location and an description and they can not be empty",
      })
    );
  }

  const todo = {
    id: uuid.v1(),
    todo: reqBody.todo,
    date: reqBody.date,
    location: reqBody.location,
    description: reqBody.description,
  };

  return db
    .put({
      TableName: todosTable,
      Item: todo,
    })
    .promise()
    .then(() => {
      callback(null, response(201, todo));
    })
    .catch((err) => response(null, response(err.statusCode, err)));
};

// Get all todos
module.exports.getAllTodos = (event, context, callback) => {
  return db
    .scan({
      TableName: todosTable,
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Update a todo
module.exports.updateTodo = (event, context, callback) => {
  const id = event.pathParameters.id;
  const body = JSON.parse(event.body);
  const paramName = body.paramName;
  const paramValue = body.paramValue;

  const params = {
    Key: {
      id: id,
    },
    TableName: todosTable,
    ConditionExpression: "attribute_exists(id)",
    UpdateExpression: "set " + paramName + " = :v",
    ExpressionAttributeValues: {
      ":v": paramValue,
    },
    ReturnValue: "ALL_NEW",
  };
  return db
    .update(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

// Delete a todo
module.exports.deleteTodo = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id: id,
    },
    TableName: todosTable,
  };
  return db
    .delete(params)
    .promise()
    .then(() =>
      callback(null, response(200, { message: "Todo deleted successfully" }))
    )
    .catch((err) => callback(null, response(err.statusCode, err)));
};
