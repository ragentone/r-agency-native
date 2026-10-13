import { parse } from 'graphql';

/**
 * GraphQL-Operationen des Auth-Moduls – identisch zur Web-App (src/core/auth/graphql).
 * Ohne Codegen: per `parse()`; die Ergebnis-Typen stehen in `../types.ts`.
 */

export const UserConfigQuery = parse(`
  query UserConfig {
    userLoadConfig {
      authorized
      refreshToken
      userId
      meta {
        id
        alias
        avatarUrl
        teaserUrl
        lastLogin
        email
        role
        superUser
        userType
        settings {
          public
          searchable
          showFullName
          showEmail
        }
      }
    }
  }
`);

export const UserLoginMutation = parse(`
  mutation UserLogin($params: userLoginParams!) {
    userLogin(params: $params) {
      success
      userId
      authToken
      meta {
        avatarUrl
        teaserUrl
        settings {
          public
          searchable
          showEmail
          showFullName
        }
        alias
        email
        role
        userType
        superUser
        lastLogin
        id
      }
    }
  }
`);

export const UserLogoutQuery = parse(`
  query UserLogout {
    userLogout {
      success
    }
  }
`);

export const CheckAuthQuery = parse(`
  query CheckAuth($userRole: [String!]) {
    userCheckAuth(userRole: $userRole) {
      hasPromission
      authorized
    }
  }
`);

export const GoogleAuthAfterMutation = parse(`
  mutation GoogleAuthAfterMutation($token: String!, $id: String!, $nonce: String!) {
    googleAuthAfter(accessToken: $token, idToken: $id, nonce: $nonce) {
      success
      gapi_pxd
      gapi_exd
    }
  }
`);

export const UserCreateMutation = parse(`
  mutation UserCreate($params: userCreateParams!) {
    userCreate(params: $params) {
      success
      userId
    }
  }
`);

export const UserEmailExistsQuery = parse(`
  query UserEmailExists($email: String!) {
    userEmailExists(email: $email) {
      exists
    }
  }
`);

export const UserAliasExistsQuery = parse(`
  query UserAliasExists($alias: String!) {
    userAliasExists(alias: $alias) {
      exists
    }
  }
`);

export const UserResetPassword = parse(`
  mutation UserPasswordReset($email: String!) {
    userPasswordReset(email: $email) {
      success
    }
  }
`);

export const UserPasswordCreate = parse(`
  mutation UserPasswordCreate($password: String!, $token: String!) {
    userPasswordCreate(password: $password, token: $token) {
      success
    }
  }
`);

export const UserPasswordChange = parse(`
  mutation UserPasswordChange($userId: String!, $currentPassword: String!, $newPassword: String!) {
    userPasswordChange(
      userId: $userId
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      success
    }
  }
`);

export const UserComparePasswordQuery = parse(`
  query UserComparePassword($pwd: String!) {
    userComparePassword(pwd: $pwd) {
      success
    }
  }
`);

export const UserConfirmMutation = parse(`
  mutation UserConfirm($token: String!) {
    userConfirm(token: $token) {
      success
      userId
    }
  }
`);

export const DeleteUserMutation = parse(`
  mutation UserDelete($pwd: String!) {
    userDelete(pwd: $pwd) {
      success
    }
  }
`);
