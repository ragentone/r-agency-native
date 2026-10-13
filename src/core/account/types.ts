export type UserGender = 'male' | 'female' | 'unknown';

export interface IUserDetails {
  firstname?: string | null;
  lastname?: string | null;
}

export interface IUserDescription {
  html?: string | null;
}

export interface IUserSettings {
  public: boolean;
  searchable: boolean;
  showEmail: boolean;
  showFullName: boolean;
}

export interface IUserAccount {
  id: string;
  alias: string;
  email: string;
  userType: string;
  avatarUrl?: string | null;
  details?: IUserDetails | null;
  gender?: UserGender | string | null;
  birthday?: string | null;
  age?: number | null;
  description?: IUserDescription | null;
  superUser?: boolean | null;
  settings?: IUserSettings | null;
  lastLogin?: Date | string | null;
}

export interface IAccountUpdateData {
  id: string;
  alias: string;
  gender: string;
  birthday?: string | null;
  details?: IUserDetails | null;
  description?: { html?: string | null } | null;
  settings?: Partial<IUserSettings> | null;
}

export interface ILoadUserAccountResponse {
  accountSelfLoad?: { account?: IUserAccount | null } | null;
}
export interface IAccountSelfUpdateResponse {
  accountSelfUpdate?: { success?: boolean | null } | null;
}
export interface IAccountSelfUpdateSettingsResponse {
  accountSelfUpdateSettings?: { success?: boolean | null } | null;
}
