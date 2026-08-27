import { db } from "@/db/database";
import type { SingerProfile } from "@/types/domain";
export interface ProfileRepository { get(): Promise<SingerProfile | undefined>; save(profile: SingerProfile): Promise<string>; }
export class IndexedDBProfileRepository implements ProfileRepository { get() { return db.profiles.get("local"); } async save(profile: SingerProfile) { await db.profiles.put(profile); return profile.id; } }
