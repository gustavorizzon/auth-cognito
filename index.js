import { config as setupEnvs } from "dotenv";
import { createHmac } from "node:crypto";
import {
  SignUpCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

setupEnvs();

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const userPoolId = process.env.USER_POOL_ID;
const region = process.env.AWS_REGION || "us-east-1";

const email = process.argv[3] || "john.doe@example.com";
console.log("email:", email);

const passwordOrCode = process.argv[4] || "TestPassword123!";
console.log("password or code:", passwordOrCode);

const client = new CognitoIdentityProviderClient({ region });

function genSecretHash(username) {
  return createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

const methods = {
  async register() {
    const response = await client.send(
      new SignUpCommand({
        ClientId: clientId,
        SecretHash: genSecretHash(email),
        Username: email,
        Password: passwordOrCode,
      })
    );

    console.log(JSON.stringify(response, null, 2));
  },

  async confirm() {
    const response = await client.send(
      new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        SecretHash: genSecretHash(email),
        ConfirmationCode: passwordOrCode,
      })
    );

    console.log(JSON.stringify(response, null, 2));
  },

  async login() {
    const response = await client.send(
      new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: email,
          PASSWORD: passwordOrCode,
          SECRET_HASH: genSecretHash(email),
        },
      })
    );

    console.log(JSON.stringify(response, null, 2));
  },

  async list() {
    const response = await client.send(
      new ListUsersCommand({
        UserPoolId: userPoolId,
      })
    );

    console.log(JSON.stringify(response, null, 2));
  },
};

function usage() {
  console.log("Method not implemented.");
  console.log("The available methods are:", Object.keys(methods));
  console.log(
    "Usage: node index.js <method> <email> <password or confirmation code>"
  );
  console.log(
    "If email/password/confirmation is ommited, a default value is used"
  );
}

async function main() {
  const method = methods[process.argv[2]] || usage;

  await method();
}

main();
