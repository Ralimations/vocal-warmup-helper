import { db } from "@/db/database";
import type { Routine } from "@/types/domain";
export interface RoutineRepository { list(): Promise<Routine[]>; save(routine: Routine): Promise<string>; delete(id: string): Promise<void>; }
export class IndexedDBRoutineRepository implements RoutineRepository { list() { return db.routines.orderBy("updatedAt").reverse().toArray(); } async save(routine: Routine) { await db.routines.put(routine); return routine.id; } delete(id: string) { return db.routines.delete(id); } }
