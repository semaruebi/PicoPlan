import { openDB, type DBSchema } from 'idb';

interface PicoPlanDB extends DBSchema {
    images: {
        key: string;
        value: {
            id: string;
            blob: Blob;
            mimeType: string;
            createdAt: number;
        };
    };
}

const DB_NAME = 'picoplan-db';
const STORE_NAME = 'images';

export const initDB = async () => {
    return openDB<PicoPlanDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const saveImageToDB = async (id: string, file: File): Promise<void> => {
    const db = await initDB();
    await db.put(STORE_NAME, {
        id,
        blob: file,
        mimeType: file.type,
        createdAt: Date.now(),
    });
};

export const getImageFromDB = async (id: string): Promise<string | null> => {
    try {
        const db = await initDB();
        const item = await db.get(STORE_NAME, id);
        if (item) {
            return URL.createObjectURL(item.blob);
        }
        return null;
    } catch (e) {
        console.error('Failed to get image from DB', e);
        return null;
    }
};

export const deleteImageFromDB = async (id: string): Promise<void> => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};
