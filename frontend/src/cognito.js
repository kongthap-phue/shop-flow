import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';

const pool = () =>
  new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  });

function toSession(result) {
  const idToken = result.getIdToken();
  const claims = idToken.decodePayload();
  return {
    token: idToken.getJwtToken(),
    user: { id: claims.sub, email: claims.email, name: claims.name || claims.email, groups: claims['cognito:groups'] ?? [] },
  };
}

export function cognitoLogin(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: pool() });
    user.authenticateUser(new AuthenticationDetails({ Username: email, Password: password }), {
      onSuccess: (result) => resolve(toSession(result)),
      onFailure: (err) => reject(new Error(err.message)),
    });
  });
}

export function cognitoRegister(name, email, password) {
  const attributes = [new CognitoUserAttribute({ Name: 'name', Value: name }), new CognitoUserAttribute({ Name: 'email', Value: email })];
  return new Promise((resolve, reject) => {
    pool().signUp(email, password, attributes, null, (err) => (err ? reject(new Error(err.message)) : resolve()));
  }).then(() => cognitoLogin(email, password));
}
