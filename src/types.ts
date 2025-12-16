export type TaskType = 'deadline' | 'scheduled';

export interface Tag {
    id: string;
    name: string;
    themeColor: string;
    imageUrl?: string;
}

export interface Task {
    id: string;
    title: string;
    date: string; // ISO string 2023-10-27
    time?: string; // HH:mm
    completed: boolean;
    type: TaskType;
    tagId?: string;
    createdAt: number;
}
