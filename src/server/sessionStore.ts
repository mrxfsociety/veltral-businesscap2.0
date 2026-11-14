import { randomUUID } from "node:crypto";
import type { Scene } from "../engine/types";
import type { TurnResponse } from "../shared/api";
import { getStorage, type Storage } from "./redis";

export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
export const CUSTOM_TTL_MS = 24 * 60 * 60 * 1000;

export type StoredTurn = TurnResponse & {
  inputMode?: "text" | "voice";
  loud?: boolean;
  timedOut?: boolean;
};

export interface StoredSession {
  id: string;
  scene: Scene;
  kind: "daily" | "library" | "custom";
  dayKey: string;
  par: number;
  turns: StoredTurn[];
  usedDoOver: boolean;
  counted: boolean;
  practice: boolean;
  finishedCounted: boolean;
  createdAt: number;
  expiresAt: number;
}

export type NewSession = Pick<
  StoredSession,
  "scene" | "kind" | "dayKey" | "par"
> & { practice?: boolean };

export function createSessionStore(storage: Storage = getStorage()) {
  return {
    async createSession(input: NewSession): Promise<StoredSession> {
      const createdAt = storage.now();
      const session: StoredSession = {
        ...input,
        id: randomUUID(),
        turns: [],
        usedDoOver: false,
        counted: false,
        practice: input.practice ?? false,
        finishedCounted: false,
        createdAt,
        expiresAt: createdAt + SESSION_TTL_MS,
      };
      await storage.set(`session:${session.id}`, session, SESSION_TTL_MS);
      return session;
    },
    async getSession(id: string): Promise<StoredSession | null> {
      const session = await storage.get<StoredSession>(`session:${id}`);
      if (session && session.expiresAt <= storage.now()) {
        await storage.delete(`session:${id}`);
        return null;
      }
      return session;
    },
    async saveSession(session: StoredSession): Promise<void> {
      // A new reply must never extend the six-hour privacy retention window.
      await storage.set(
        `session:${session.id}`,
        session,
        session.expiresAt - storage.now(),
      );
    },
    withSessionLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
      return storage.withLock(`session-lock:${id}`, operation);
    },
    async saveCustomScene(scene: Scene): Promise<void> {
      await storage.set(`custom:${scene.id}`, scene, CUSTOM_TTL_MS);
    },
    getCustomScene(id: string): Promise<Scene | null> {
      return storage.get<Scene>(`custom:${id}`);
    },
  };
}

export const createSession = (input: NewSession) =>
  createSessionStore().createSession(input);
export const getSession = (id: string) => createSessionStore().getSession(id);
export const saveSession = (session: StoredSession) =>
  createSessionStore().saveSession(session);
export const withSessionLock = <T>(id: string, operation: () => Promise<T>) =>
  createSessionStore().withSessionLock(id, operation);
export const saveCustomScene = (scene: Scene) =>
  createSessionStore().saveCustomScene(scene);
export const getCustomScene = (id: string) =>
  createSessionStore().getCustomScene(id);
