import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ClientGroupInput {
    name: string;
    description?: string;
}
export interface ClientInput {
    name: string;
    email?: string;
    company?: string;
    groupId: GroupId;
    notes?: string;
    phone?: string;
}
export interface Script {
    id: ScriptId;
    title: string;
    content: string;
    createdAt: bigint;
    updatedAt: bigint;
    category?: string;
}
export interface ScriptInput {
    title: string;
    content: string;
    category?: string;
}
export interface ClientGroup {
    id: GroupId;
    name: string;
    createdAt: bigint;
    description?: string;
}
export type ScriptId = bigint;
export interface Client {
    id: ClientId;
    name: string;
    createdAt: bigint;
    email?: string;
    company?: string;
    groupId: GroupId;
    notes?: string;
    phone?: string;
}
export type ClientId = bigint;
export type GroupId = bigint;
export interface backendInterface {
    addClient(input: ClientInput): Promise<ClientId>;
    addClientGroup(input: ClientGroupInput): Promise<GroupId>;
    addScript(input: ScriptInput): Promise<ScriptId>;
    deleteClient(id: ClientId): Promise<void>;
    deleteClientGroup(id: GroupId): Promise<void>;
    deleteScript(id: ScriptId): Promise<void>;
    getClientGroups(): Promise<Array<ClientGroup>>;
    getClients(): Promise<Array<Client>>;
    getClientsByGroup(groupId: GroupId): Promise<Array<Client>>;
    getScript(id: ScriptId): Promise<Script>;
    getScripts(): Promise<Array<Script>>;
    getScriptsByCategory(category: string): Promise<Array<Script>>;
    getScriptsByTitle(): Promise<Array<Script>>;
    updateClient(id: ClientId, input: ClientInput): Promise<void>;
    updateClientGroup(id: GroupId, input: ClientGroupInput): Promise<void>;
    updateScript(id: ScriptId, input: ScriptInput): Promise<void>;
}
