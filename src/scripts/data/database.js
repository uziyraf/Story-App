import { openDB } from 'idb';
 
const DATABASE_NAME = 'story';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'saved-reports';
 
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database) => {
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, {
        keyPath: 'id',
      });
    }
  },
});

export const saveReport = async (report) => {
  if (!report.hasOwnProperty('id')) {
    throw new Error('Report object must have an id property');
  }
  const db = await dbPromise;
  const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
  await tx.store.put(report);
  await tx.done;
};

export const getAllReports = async () => {
  const db = await dbPromise;
  const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
  const allReports = await tx.store.getAll();
  await tx.done;
  return allReports;
};

export const getReportById = async (id) => {
  if (!id) {
    throw new Error('`id` is required.');
  }
  const db = await dbPromise;
  const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
  const report = await tx.store.get(id);
  await tx.done;
  return report;
};

export const deleteReport = async (id) => {
  const db = await dbPromise;
  const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
  await tx.store.delete(id);
  await tx.done;
};
