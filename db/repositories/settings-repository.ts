import { db } from "@/db/database";
import type { AppSettings } from "@/types/domain";
export class IndexedDBSettingsRepository { get() { return db.settings.get("local"); } async save(settings: AppSettings) { await db.settings.put(settings); return settings.id; } }
