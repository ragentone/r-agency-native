/** Typen der Auth-GraphQL-Operationen (entsprechen den Feldern in graphql/*). */

export interface IUserConfigSettings {
  public?: boolean | null;
  searchable?: boolean | null;
  showFullName?: boolean | null;
  showEmail?: boolean | null;
}

export interface IUserMetaData {
  id?: string | null;
  alias?: string | null;
  avatarUrl?: string | null;
  teaserUrl?: string | null;
  lastLogin?: string | number | Date | null | unknown;
  email?: string | null;
  role?: string | string[] | unknown;
  superUser?: boolean | null;
  userType?: string | null;
  settings?: IUserConfigSettings | null;
}

export type IUserMeta = IUserMetaData;

export interface ILoginParams {
  email: string;
  password: string;
  userType: string | null | undefined;
}

export interface IUserCreateParams {
  alias: string;
  email: string;
  password: string;
}

export interface IUserLoadConfig {
  authorized?: boolean | null;
  refreshToken?: string | null;
  userId?: string | null;
  meta?: IUserMetaData | null;
}

export interface IUserLoginReturn {
  success?: boolean | null;
  userId?: string | null;
  authToken?: string | null;
  meta?: IUserMetaData | null;
}

export interface IGoogleAuthParams {
  token: string;
  id: string;
  nonce: string;
}

export interface IGoogleAuthResult {
  success?: boolean | null;
  gapi_pxd?: string | null;
  gapi_exd?: string | null;
}

export type GoogleAuthAfterReturn = IGoogleAuthResult | null | undefined;

export interface ISuccessReturn {
  success?: boolean | null;
}

export interface IUserCreateReturn extends ISuccessReturn {
  userId?: string | null;
}

export interface IUploadReturn extends ISuccessReturn {
  url?: string | null;
}

// Antworten
export interface IUserConfigResponse {
  userLoadConfig?: IUserLoadConfig | null;
}
export interface IUserLoginResponse {
  userLogin?: IUserLoginReturn | null;
}
export interface IUserLogoutResponse {
  userLogout?: ISuccessReturn | null;
}
export interface ICheckAuthResponse {
  userCheckAuth?: { hasPromission?: boolean | null; authorized?: boolean | null } | null;
}
export interface IGoogleAuthAfterResponse {
  googleAuthAfter?: IGoogleAuthResult | null;
}
export interface IUserCreateResponse {
  userCreate?: IUserCreateReturn | null;
}
export interface IUserEmailExistsResponse {
  userEmailExists?: { exists?: boolean | null } | null;
}
export interface IUserAliasExistsResponse {
  userAliasExists?: { exists?: boolean | null } | null;
}
export interface IUserPasswordResetResponse {
  userPasswordReset?: ISuccessReturn | null;
}
export interface IUserPasswordCreateResponse {
  userPasswordCreate?: ISuccessReturn | null;
}
export interface IUserPasswordChangeResponse {
  userPasswordChange?: ISuccessReturn | null;
}
export interface IUserComparePasswordResponse {
  userComparePassword?: ISuccessReturn | null;
}
export interface IUserConfirmResponse {
  userConfirm?: { success?: boolean | null; userId?: string | null } | null;
}
export interface IUserDeleteResponse {
  userDelete?: ISuccessReturn | null;
}
