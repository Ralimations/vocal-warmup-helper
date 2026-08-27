import Dexie, { type Table } from "dexie";
import type { AppSettings, Achievement, PracticeSession, Routine, SingerProfile, Song } from "@/types/domain";

export class VocalWarmupDatabase extends Dexie { profiles!: Table<SingerProfile, string>; routines!: Table<Routine, string>; practiceSessions!: Table<PracticeSession, string>; achievements!: Table<Achievement, string>; songs!: Table<Song, string>; settings!: Table<AppSettings, string>; constructor() { super("VocalWarmupDB"); this.version(1).stores({ profiles: "id", routines: "id,updatedAt", practiceSessions: "id,startedAt", achievements: "id", songs: "id,status", settings: "id" }); } }
export const db = new VocalWarmupDatabase();
