export type TaskType = 'deadline' | 'scheduled';

export interface Tag {
    id: string;
    name: string;
    themeColor: string;
    imageUrl?: string;
    localImageId?: string; // IndexedDB ID
}

export interface Task {
    id: string;
    title: string;
    date: string; // ISO string 2023-10-27
    time?: string; // HH:mm
    completed: boolean;
    type: TaskType;
    tagId?: string;
    imageUrl?: string;
    localImageId?: string; // IndexedDB ID
    imageOffsetY?: number; // 0-100 percentage for object-position-y
    imageOpacity?: number; // 0-100 percentage for opacity
    createdAt: number;
}
