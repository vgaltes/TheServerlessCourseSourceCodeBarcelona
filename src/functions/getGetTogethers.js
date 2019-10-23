const AWS = require("aws-sdk");
const middy = require("middy");
const { ssm } = require("middy/middlewares");
const FunctionShield = require('@puresec/function-shield');
FunctionShield.configure({
    policy: {
        // 'block' mode => active blocking
        // 'alert' mode => log only
        // 'allow' mode => allowed, implicitly occurs if key does not exist
        outbound_connectivity: "alert",
        read_write_tmp: "block", 
        create_child_process: "block",
        read_handler: "block" },
    token: process.env.functionShieldToken });

const dynamodb = new AWS.DynamoDB.DocumentClient();

const handler = async (evt, context) => {
  const count = 8;
  const tableName = context.tableName;

  const req = {
    TableName: tableName,
    Limit: count
  };

  const resp = await dynamodb.scan(req).promise();

  const res = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(resp.Items)
  };

  return res;
};

module.exports.handler = middy(handler).use(
  ssm({
    cache: true,
    cacheExpiryInMillis: 3 * 60 * 1000,
    setToContext: true,
    names: {
      tableName: `${process.env.getTogethersTableNamePath}`
    }
  })
);