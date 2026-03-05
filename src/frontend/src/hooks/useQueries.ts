import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Client,
  ClientGroup,
  ClientGroupInput,
  ClientId,
  ClientInput,
  GroupId,
  Script,
  ScriptId,
  ScriptInput,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Scripts ────────────────────────────────────────────────────────────────

export function useGetScripts() {
  const { actor, isFetching } = useActor();
  return useQuery<Script[]>({
    queryKey: ["scripts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScripts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddScript() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScriptInput): Promise<ScriptId> => {
      if (!actor) throw new Error("No actor");
      return actor.addScript(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useUpdateScript() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: ScriptId;
      input: ScriptInput;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateScript(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useDeleteScript() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: ScriptId) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteScript(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

// ── Client Groups ──────────────────────────────────────────────────────────

export function useGetClientGroups() {
  const { actor, isFetching } = useActor();
  return useQuery<ClientGroup[]>({
    queryKey: ["clientGroups"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClientGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddClientGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientGroupInput): Promise<GroupId> => {
      if (!actor) throw new Error("No actor");
      return actor.addClientGroup(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientGroups"] });
    },
  });
}

export function useUpdateClientGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: GroupId;
      input: ClientGroupInput;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateClientGroup(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientGroups"] });
    },
  });
}

export function useDeleteClientGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: GroupId) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteClientGroup(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientGroups"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ── Clients ────────────────────────────────────────────────────────────────

export function useGetClients() {
  const { actor, isFetching } = useActor();
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput): Promise<ClientId> => {
      if (!actor) throw new Error("No actor");
      return actor.addClient(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: ClientId;
      input: ClientInput;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateClient(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: ClientId) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteClient(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
