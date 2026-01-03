import Dexie from "dexie";
export const db = new Dexie("ComedyDatabase");

// increment id
// name - filename
// content - file content
// updatedAt - time of updating


db.version(1).stores({
    jokes: "++id, name, content, updatedAt"
});
