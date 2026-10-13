import { useCallback, useState } from 'react';

import { useGraphQl } from '@/core/mesh';

import {
  DeleteUserMutation,
  UserAliasExistsQuery,
  UserComparePasswordQuery,
  UserConfirmMutation,
  UserCreateMutation,
  UserEmailExistsQuery,
  UserLoginMutation,
  UserPasswordChange,
  UserPasswordCreate,
  UserResetPassword,
} from '../graphql';
import type {
  ILoginParams,
  IUserAliasExistsResponse,
  IUserComparePasswordResponse,
  IUserConfirmResponse,
  IUserCreateParams,
  IUserCreateResponse,
  IUserDeleteResponse,
  IUserEmailExistsResponse,
  IUserLoginResponse,
  IUserPasswordChangeResponse,
  IUserPasswordCreateResponse,
  IUserPasswordResetResponse,
} from '../types';

/** Führt eine Anfrage aus und hält dabei `loading` aktuell. */
const useLoading = () => {
  const [loading, setLoading] = useState(false);
  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await task();
    } finally {
      setLoading(false);
    }
  }, []);
  return { loading, run };
};

/** Login ohne Session-Handling (das macht `useAuth().login`). */
export const useUserLogin = () => {
  const { mutate } = useGraphQl();
  const { loading, run } = useLoading();
  const login = useCallback(
    (params: ILoginParams) =>
      run(async () => {
        const response = await mutate<IUserLoginResponse>({
          mutation: UserLoginMutation,
          variables: { params },
        });
        return response.data?.userLogin;
      }),
    [mutate, run]
  );
  return { login, loading };
};

export const useUserCreate = () => {
  const { mutate, query } = useGraphQl();
  const { loading, run } = useLoading();

  const createUser = useCallback(
    (params: IUserCreateParams) =>
      run(async () => {
        const response = await mutate<IUserCreateResponse>({
          mutation: UserCreateMutation,
          variables: { params },
        });
        return response.data?.userCreate;
      }),
    [mutate, run]
  );

  /** `true`, wenn die E-Mail schon vergeben ist (bei Netzwerkfehler `false`, wie in der Web-App). */
  const emailExists = useCallback(
    async (email: string) => {
      try {
        const response = await query<IUserEmailExistsResponse>({
          query: UserEmailExistsQuery,
          variables: { email: email.trim() },
          fetchPolicy: 'no-cache',
        });
        return Boolean(response.data?.userEmailExists?.exists);
      } catch {
        return false;
      }
    },
    [query]
  );

  const aliasExists = useCallback(
    async (alias: string) => {
      try {
        const response = await query<IUserAliasExistsResponse>({
          query: UserAliasExistsQuery,
          variables: { alias: alias.trim() },
          fetchPolicy: 'no-cache',
        });
        return Boolean(response.data?.userAliasExists?.exists);
      } catch {
        return false;
      }
    },
    [query]
  );

  return { createUser, create: createUser, emailExists, aliasExists, loading };
};

export interface IChangePasswordParams {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export const useUserPassword = () => {
  const { mutate, query } = useGraphQl();
  const { loading, run } = useLoading();

  const createPassword = useCallback(
    (password: string, token: string) =>
      run(async () => {
        const response = await mutate<IUserPasswordCreateResponse>({
          mutation: UserPasswordCreate,
          variables: { password, token },
        });
        return response.data?.userPasswordCreate;
      }),
    [mutate, run]
  );

  const resetPassword = useCallback(
    (email: string) =>
      run(async () => {
        const response = await mutate<IUserPasswordResetResponse>({
          mutation: UserResetPassword,
          variables: { email },
        });
        return response.data?.userPasswordReset;
      }),
    [mutate, run]
  );

  const changePassword = useCallback(
    ({ userId, currentPassword, newPassword }: IChangePasswordParams) =>
      run(async () => {
        const response = await mutate<IUserPasswordChangeResponse>({
          mutation: UserPasswordChange,
          variables: { userId, currentPassword, newPassword },
        });
        return response.data?.userPasswordChange;
      }),
    [mutate, run]
  );

  const comparePassword = useCallback(
    (pwd: string) =>
      run(async () => {
        const response = await query<IUserComparePasswordResponse>({
          query: UserComparePasswordQuery,
          variables: { pwd },
          fetchPolicy: 'no-cache',
        });
        return response.data?.userComparePassword?.success ?? false;
      }),
    [query, run]
  );

  return {
    createPassword,
    resetPassword,
    changePassword,
    comparePassword,
    create: createPassword,
    reset: resetPassword,
    change: changePassword,
    compare: comparePassword,
    loading,
  };
};

export interface IUserConfirmOutcome {
  success: boolean;
  userId?: string | null;
  /** Backend-Übersetzungs-Key, z. B. `user_invalid_confirm_token`. */
  errorKey?: string;
}

/** Ein Bestätigungs-Token ist nur einmal gültig → eine Anfrage pro Token. */
const pendingConfirms = new Map<string, Promise<IUserConfirmOutcome>>();

const errorKeyOf = (errors: unknown): string | undefined => {
  if (!Array.isArray(errors) || errors.length === 0) return undefined;
  const first = errors[0] as { translateKey?: string; extensions?: Record<string, unknown> };
  const key = first.translateKey ?? first.extensions?.translateKey ?? first.extensions?.code;
  return typeof key === 'string' ? key : undefined;
};

export const useUserConfirm = () => {
  const { mutate } = useGraphQl();
  const confirm = useCallback(
    (token: string): Promise<IUserConfirmOutcome> => {
      const running = pendingConfirms.get(token);
      if (running) return running;
      const request = (async (): Promise<IUserConfirmOutcome> => {
        try {
          const response = await mutate<IUserConfirmResponse>({
            mutation: UserConfirmMutation,
            variables: { token },
          });
          const result = response.data?.userConfirm;
          if (result?.success) return { success: true, userId: result.userId };
          return { success: false, errorKey: errorKeyOf(response.errors) };
        } catch (error) {
          return {
            success: false,
            errorKey: errorKeyOf((error as { graphQLErrors?: unknown })?.graphQLErrors),
          };
        }
      })();
      pendingConfirms.set(token, request);
      return request;
    },
    [mutate]
  );
  return { confirm };
};

export const useUserDelete = () => {
  const { mutate } = useGraphQl();
  const { loading, run } = useLoading();
  const deleteUser = useCallback(
    (pwd: string) =>
      run(async () => {
        const response = await mutate<IUserDeleteResponse>({
          mutation: DeleteUserMutation,
          variables: { pwd },
        });
        return response.data?.userDelete;
      }),
    [mutate, run]
  );
  return { deleteUser, loading };
};
