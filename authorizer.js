// AWS Cognito service will be used to handle the identity and authorization tokens.
// UserPool AppClient is used to interact with the userpool we have created.

const { CognitoJwtVerifier } = require('aws-jwt-verify');

const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USERPOOL_ID,
  tokenUse: 'id',
  clientId: COGNITO_WEB_CLIENT_ID,
});

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;

  var tmp = resource.split(':');
  var apiGatewayArnTmp = tmp[5].split('/');

  // Create wildcard resource
  var resource =
    tmp[0] +
    ':' +
    tmp[1] +
    ':' +
    tmp[2] +
    ':' +
    tmp[3] +
    ':' +
    tmp[4] +
    ':' +
    apiGatewayArnTmp[0] +
    '/*/*';

  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: effect,
          Resource: resource,
          Action: 'execute-api:Invoke',
        },
      ],
    };

    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    foo: 'bar',
  };

  console.log(JSON.stringify(authResponse));
  return authResponse;
};

exports.handler = async (event, context, callback) => {
  // Lambda authorizer code
  const token = event?.authorizationToken;
  console.log(token);

  try {
    const payload = await jwtVerifier.verify(token);
    console.log(JSON.stringify(payload));
    callback(null, generatePolicy('user', 'Allow', event?.methodArn));
  } catch (error) {
    callback('Error: Invalid token');
  }

  // switch (token) {
  //   case 'allow':
  //     callback(null, generatePolicy('user', 'Allow', event?.methodArn));
  //     break;
  //   case 'deny':
  //     callback(null, generatePolicy('user', 'Deny', event?.methodArn));
  //     break;
  //   default:
  //     callback('Error: Invalid token');
  //     break;
  // }
};
