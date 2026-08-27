import { db } from "@/db/database";
import type { Song } from "@/types/domain";
export class IndexedDBSongRepository { list() { return db.songs.toArray(); } async save(song: Song) { await db.songs.put(song); return song.id; } delete(id: string) { return db.songs.delete(id); } }
