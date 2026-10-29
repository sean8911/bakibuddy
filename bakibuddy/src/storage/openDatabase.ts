import { Platform } from "react-native";
import { LedgerRepository, migrate, type SqlDriver } from "./repository";

let connection: Promise<LedgerRepository> | undefined;
export function openLedger(): Promise<LedgerRepository> {
  if (!connection)
    connection = (async () => {
      // Import on the client; web static rendering must not start a worker/database.
      const SQLite = await import("expo-sqlite");
      const db = await SQLite.openDatabaseAsync("bakibuddy.db");
      try {
        if (Platform.OS !== "web")
          await db.execAsync("PRAGMA journal_mode = WAL;");
        const driver: SqlDriver = {
          exec: (sql) => db.execAsync(sql),
          all: <T>(sql: string, params = []) => db.getAllAsync<T>(sql, params),
          run: (sql, params = []) => db.runAsync(sql, params),
        };
        await migrate(driver);
        return new LedgerRepository(driver);
      } catch (error) {
        await db.closeAsync().catch(() => undefined);
        throw error;
      }
    })().catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
