import { parse } from 'graphql';

/** GraphQL des Account-Moduls – identisch zur Web-App (src/core/account/graphql). */

export const LoadUserAccountQuery = parse(`
  query LoadUserAccount {
    accountSelfLoad {
      account {
        id
        alias
        avatarUrl
        userType
        gender
        lastLogin
        birthday
        age
        superUser
        description {
          html
        }
        settings {
          searchable
          public
          showEmail
          showFullName
        }
        email
        details {
          firstname
          lastname
        }
      }
    }
  }
`);

export const UpdateUserAccountMutation = parse(`
  mutation AccountSelfUpdate($data: accountUpdateData!) {
    accountSelfUpdate(accountData: $data) {
      success
    }
  }
`);

export const UpdateUserAccountSettingsMutation = parse(`
  mutation AccountSelfUpdateSettings($settings: userSettingsInput!, $userId: String!) {
    accountSelfUpdateSettings(settings: $settings, userId: $userId) {
      success
    }
  }
`);
