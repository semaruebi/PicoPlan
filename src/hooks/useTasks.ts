import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskType, Tag } from '../types';

interface Game {
    id: string;
    title: string;
    themeColor: string;
}

const STORAGE_KEY_TASKS = 'picoplan-tasks'; // Changed from deadline-mate
const STORAGE_KEY_TAGS = 'picoplan-tags';
const LEGACY_STORAGE_KEY_GAMES = 'deadline-mate-games'; // For migration
const LEGACY_STORAGE_KEY_TASKS = 'deadline-mate-tasks'; // For migration

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        // Load Tags (Migrating from Games if needed)
        const savedTags = localStorage.getItem(STORAGE_KEY_TAGS);
        if (savedTags) {
            setTags(JSON.parse(savedTags));
        } else {
            // Check for legacy games
            const savedGames = localStorage.getItem(LEGACY_STORAGE_KEY_GAMES);
            if (savedGames) {
                try {
                    const games: Game[] = JSON.parse(savedGames);
                    const migratedTags: Tag[] = games.map(g => ({
                        id: g.id,
                        name: g.title, // Map title to name
                        themeColor: g.themeColor
                    }));
                    setTags(migratedTags);
                    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(migratedTags));
                } catch (e) {
                    console.error("Failed to migrate games", e);
                    setTags([]);
                }
            } else {
                // Initial Tags if nothing exists
                const initialTags: Tag[] = [
                    { id: 'tag-1', name: '仕事', themeColor: '#607d8b' },
                    { id: 'tag-2', name: '買い物', themeColor: '#4caf50' },
                    { id: 'tag-3', name: '勉強', themeColor: '#ff9800' },
                ];
                setTags(initialTags);
                localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(initialTags));
            }
        }

        // Load Tasks
        const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
        } else {
            // Check for legacy tasks
            const legacyTasks = localStorage.getItem(LEGACY_STORAGE_KEY_TASKS);
            if (legacyTasks) {
                try {
                    const oldTasks: any[] = JSON.parse(legacyTasks);
                    const migratedTasks: Task[] = oldTasks.map(t => ({
                        ...t,
                        tagId: t.gameId, // Map gameId to tagId
                        createdAt: t.createdAt || Date.now() // Ensure createdAt exists
                    }));

                    // Cleanup extra props if needed, but safe to cast
                    const cleanTasks = migratedTasks.map(({ gameId, ...rest }: any) => rest as Task);

                    setTasks(cleanTasks);
                    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(cleanTasks));
                } catch (e) {
                    console.error("Failed to migrate tasks", e);
                    setTasks([]);
                }
            }
        }
    }, []);

    const saveTasks = (newTasks: Task[]) => {
        setTasks(newTasks);
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks));
    };

    const saveTags = (newTags: Tag[]) => {
        setTags(newTags);
        localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(newTags));
    };

    const addTask = (title: string, date: string, type: TaskType, tagId?: string, time?: string) => {
        const newTask: Task = {
            id: uuidv4(),
            title,
            date,
            type,
            completed: false,
            tagId,
            time,
            createdAt: Date.now()
        };
        saveTasks([...tasks, newTask]);
    };

    const toggleTask = (id: string) => {
        const newTasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks(newTasks);
    };

    const deleteTask = (id: string) => {
        if (window.confirm('タスクを削除してもよろしいですか？')) {
            const newTasks = tasks.filter(task => task.id !== id);
            saveTasks(newTasks);
        }
    };

    const addTag = (name: string, themeColor: string, imageUrl?: string) => {
        const newTag: Tag = {
            id: uuidv4(),
            name,
            themeColor,
            imageUrl
        };
        saveTags([...tags, newTag]);
    };

    const deleteTag = (id: string) => {
        const newTags = tags.filter(g => g.id !== id);
        saveTags(newTags);

        const newTasks = tasks.map(t =>
            t.tagId === id ? { ...t, tagId: undefined } : t
        );
        saveTasks(newTasks);
    };

    return {
        tasks,
        tags,
        addTask,
        toggleTask,
        deleteTask,
        addTag,
        deleteTag
    };
};
