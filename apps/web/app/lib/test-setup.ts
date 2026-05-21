import "fake-indexeddb/auto";
import Dexie from "dexie";

// Must be set before any Dexie instance is created
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;
