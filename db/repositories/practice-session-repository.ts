import { db } from "@/db/database";
import type { PracticeSession } from "@/types/domain";
export interface PracticeSessionRepository { list(): Promise<PracticeSession[]>; save(session: PracticeSession): Promise<string>; }
export class IndexedDBPracticeSessionRepository implements PracticeSessionRepository { list() { return db.practiceSessions.orderBy("startedAt").reverse().toArray(); } async save(session: PracticeSession) { await db.practiceSessions.put(session); return session.id; } }
