// Muss vor dem Mesh-Client geladen werden: richtet auf iOS/Android dessen Browser-Umgebung ein.
import '../platform/mesh.window';

import {
  type IMeshGraphqlClient,
  type IMeshGraphqlProps,
  type IWebSocket,
  useMesh,
} from 'r-agency-mesh-client-v1/release';
import { useCallback, useContext, useEffect, useRef } from 'react';

import { MeshContext } from './mesh.context';

const useWebsocket = (): IWebSocket => {
  const { websocket } = useMesh();
  return websocket;
};

const useGraphQl = (props?: IMeshGraphqlProps): IMeshGraphqlClient => {
  const { graphql } = useMesh();
  return graphql(props);
};

/**
 * Stable getter for a GraphQL client: `const getGraphql = useGraphQlGetter();` →
 * `getGraphql().query(…)` inside callbacks / effects.
 *
 * `useGraphQl()` returns a *new* client on every render (the mesh client creates a fresh
 * Apollo client with the current headers each time). Callbacks that depend on it change on
 * every render too – used in a `useEffect` dependency list that ends in an endless loop
 * ("Maximum update depth exceeded"). The getter never changes and still creates the client
 * at call time, so headers (auth token …) are always current.
 */
const useGraphQlGetter = (): ((props?: IMeshGraphqlProps) => IMeshGraphqlClient) => {
  const { graphql } = useMesh();
  const ref = useRef(graphql);
  useEffect(() => {
    ref.current = graphql;
  });
  return useCallback((props?: IMeshGraphqlProps) => ref.current(props), []);
};

/** Mesh-Zustand oder `null`, wenn kein MeshProvider darüber liegt. */
const useOptionalMeshState = () => useContext(MeshContext) ?? null;

const useMeshState = () => {
  const context = useContext(MeshContext);
  if (!context) {
    throw new Error('MeshProvider is not initialized');
  }
  return {
    connected: context.connected,
    status: context.status,
    retryCount: context.retryCount,
    error: context.error,
    reconnect: context.reconnect,
  };
};

export { useGraphQl, useGraphQlGetter, useMeshState, useOptionalMeshState, useWebsocket };
