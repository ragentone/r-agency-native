import { useCallback, useEffect, useState } from 'react';

import { UserAliasExistsQuery } from '@/core/auth/graphql';
import { useAuth } from '@/core/auth/components/use.auth';
import type { IUserAliasExistsResponse } from '@/core/auth/types';
import { useGraphQl, useMeshState } from '@/core/mesh';

import {
  LoadUserAccountQuery,
  UpdateUserAccountMutation,
  UpdateUserAccountSettingsMutation,
} from './graphql';
import type {
  IAccountSelfUpdateResponse,
  IAccountSelfUpdateSettingsResponse,
  IAccountUpdateData,
  ILoadUserAccountResponse,
  IUserAccount,
  IUserSettings,
} from './types';

/** Antworten je Alias (klein geschrieben) – nicht bei jedem Prüfen erneut fragen. */
const aliasExistsCache = new Map<string, boolean>();

/** Konto laden / ändern – Port von `useAccount` der Web-App. */
export const useAccount = (autoLoad: boolean = true) => {
  const { connected } = useMeshState();
  const { query, mutate } = useGraphQl();
  const { refreshUserMeta } = useAuth();

  const [account, setAccount] = useState<IUserAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadAccount = useCallback(async (): Promise<IUserAccount | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await query<ILoadUserAccountResponse>({
        query: LoadUserAccountQuery,
        fetchPolicy: 'no-cache',
      });
      const data = response.data?.accountSelfLoad?.account ?? null;
      setAccount(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [query]);

  const updateAccount = useCallback(
    async (data: IAccountUpdateData): Promise<boolean> => {
      setUpdating(true);
      setError(null);
      try {
        const response = await mutate<IAccountSelfUpdateResponse>({
          mutation: UpdateUserAccountMutation,
          variables: {
            data: {
              id: data.id,
              alias: data.alias,
              gender: data.gender,
              birthday: data.birthday,
              details: data.details,
              description: { html: data.description?.html ?? '' },
              settings: {
                public: data.settings?.public ?? account?.settings?.public ?? true,
                searchable: data.settings?.searchable ?? account?.settings?.searchable ?? true,
                showEmail: data.settings?.showEmail ?? account?.settings?.showEmail ?? false,
                showFullName: data.settings?.showFullName ?? account?.settings?.showFullName ?? true,
              },
            },
          },
        });
        const success = response.data?.accountSelfUpdate?.success ?? false;
        // Konto-Ansicht + globale userMeta (Alias in Begrüßung usw.).
        if (success) await Promise.all([loadAccount(), refreshUserMeta()]);
        return success;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [account, loadAccount, mutate, refreshUserMeta]
  );

  const updateSettings = useCallback(
    async (settings: IUserSettings, userId?: string): Promise<boolean> => {
      setUpdating(true);
      setError(null);
      try {
        const response = await mutate<IAccountSelfUpdateSettingsResponse>({
          mutation: UpdateUserAccountSettingsMutation,
          variables: { settings, userId: userId || account?.id || '' },
        });
        const success = response.data?.accountSelfUpdateSettings?.success ?? false;
        if (success) await Promise.all([loadAccount(), refreshUserMeta()]);
        return success;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [account, loadAccount, mutate, refreshUserMeta]
  );

  /** `true`, wenn der Alias schon vergeben ist (eigener Alias zählt nicht). */
  const aliasTaken = useCallback(
    async (alias: string, currentAlias?: string | null): Promise<boolean> => {
      const value = alias.trim();
      if (!value) return false;
      if (currentAlias && value.toLowerCase() === currentAlias.trim().toLowerCase()) return false;
      const key = value.toLowerCase();
      const known = aliasExistsCache.get(key);
      if (known !== undefined) return known;
      try {
        const response = await query<IUserAliasExistsResponse>({
          query: UserAliasExistsQuery,
          variables: { alias: value },
          fetchPolicy: 'no-cache',
        });
        const exists = Boolean(response.data?.userAliasExists?.exists);
        aliasExistsCache.set(key, exists);
        return exists;
      } catch {
        // Backend nicht erreichbar → nicht blockieren, das Update prüft selbst.
        return false;
      }
    },
    [query]
  );

  useEffect(() => {
    if (connected && autoLoad) void loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, connected]);

  return { account, loading, updating, error, loadAccount, updateAccount, updateSettings, aliasTaken };
};

export const useUserAccount = useAccount;
