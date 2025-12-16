import React from 'react';
import type { Task, Tag } from '../types';
import { Trash2, Check, Clock, Calendar, Pencil, X } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { hexToRgba } from '../utils/colorUtils';
import { useImage } from '../hooks/useImage';
import { useState } from 'react';

interface TaskListProps {
    tasks: Task[];
    tags: Tag[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTag?: (tagId: string) => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

// Helper component for tag display
const TagChip = ({ tag, onSelectTag }: { tag: Tag, onSelectTag?: (id: string) => void }) => {
    const imageUrl = useImage(tag.localImageId, tag.imageUrl);

    return (
        <span
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border-2 font-black tracking-tight shadow-sm backdrop-blur-sm",
                onSelectTag && "cursor-pointer hover:shadow-md hover:scale-105 active:scale-95",
                "bg-white/50 dark:bg-slate-800/50" // Base fallback
            )}
            style={{
                borderColor: tag.themeColor,
                color: tag.themeColor,
                backgroundColor: hexToRgba(tag.themeColor, 0.1) // Glass effect
            }}
            onClick={(e) => {
                if (onSelectTag) {
                    e.stopPropagation();
                    onSelectTag(tag.id);
                }
            }}
        >
            {imageUrl ? (
                <img src={imageUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-current" />
            ) : (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.themeColor }} />
            )}
            <span className="text-xs uppercase">{tag.name}</span>
        </span>
    );
};

// Extracted TaskItem component to call hooks per item
const TaskItem = ({ task, tags, tag, onToggle, onDelete, onSelectTag, onUpdateTask }: { task: Task, tags: Tag[], tag?: Tag, onToggle: (id: string) => void, onDelete: (id: string) => void, onSelectTag?: (id: string) => void, onUpdateTask: (id: string, updates: Partial<Task>) => void }) => {
    const isDeadlinePassed = task.type === 'deadline' && isPast(parseISO(task.date)) && !isToday(parseISO(task.date)) && !task.completed;
    const isDueToday = isToday(parseISO(task.date));
    const isDueTomorrow = isTomorrow(parseISO(task.date));
    const date = parseISO(task.date);
    // Removed showSettings

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDate, setEditDate] = useState(task.date);
    const [editTime, setEditTime] = useState(task.time || '');
    const [editTagId, setEditTagId] = useState(task.tagId || '');
    // Image edit state
    const [editImageOffsetY, setEditImageOffsetY] = useState(task.imageOffsetY ?? 50);
    const [editImageOpacity, setEditImageOpacity] = useState(task.imageOpacity ?? 30);

    const handleSave = () => {
        onUpdateTask(task.id, {
            title: editTitle,
            date: editDate,
            time: editTime || undefined,
            tagId: editTagId || undefined,
            imageOffsetY: editImageOffsetY,
            imageOpacity: editImageOpacity
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(task.title);
        setEditDate(task.date);
        setEditTime(task.time || '');
        setEditTagId(task.tagId || '');
        setEditImageOffsetY(task.imageOffsetY ?? 50);
        setEditImageOpacity(task.imageOpacity ?? 30);
        setIsEditing(false);
    };

    // Resolve image URL (Local > Remote)
    const displayImageUrl = useImage(task.localImageId, task.imageUrl);

    return (
        <div
            className={clsx(
                "group relative flex items-center gap-3 p-4 bg-bg-300 rounded-2xl border-2 transition-all duration-300 ease-in-out overflow-hidden",
                task.completed
                    ? "border-bg-200 bg-bg-100 dark:border-slate-800"
                    : "hover:shadow-lg hover:border-primary-100 border-bg-200 dark:border-slate-700 hover:scale-[1.02] active:scale-[0.98]",
                isDeadlinePassed && !task.completed && "border-l-4 border-l-red-400"
            )}
            style={
                !isDeadlinePassed && !task.completed && tag ? { borderLeft: `4px solid ${tag.themeColor}` } : {}
            }
        >
            {/* Hero Image Background */}
            {displayImageUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={displayImageUrl}
                        alt=""
                        className={clsx(
                            "w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105",
                            !task.imageOpacity && "opacity-20 dark:opacity-10" // Fallback
                        )}
                        style={{
                            objectPosition: `center ${task.imageOffsetY ?? 50}%`,
                            opacity: task.imageOpacity ? task.imageOpacity / 100 : undefined
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-300/95 via-bg-300/60 to-transparent dark:from-slate-800/95 dark:via-slate-800/60 pointer-events-none"></div>
                </div>
            )}
            <button
                onClick={() => onToggle(task.id)}
                className={clsx(
                    "relative z-10 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                    task.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-text-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-transparent"
                )}
            >
                <Check size={14} className={clsx("transition-transform", task.completed ? "scale-100" : "scale-0")} />
            </button>

            <div className="flex-1 min-w-0 relative z-10">
                {isEditing ? (
                    <div className="space-y-3 p-1">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-white/50 dark:bg-slate-800/50 border border-bg-200 rounded-lg px-3 py-2 font-bold text-lg text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            placeholder="タスク名"
                        />
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="bg-white/50 dark:bg-slate-800/50 border border-bg-200 rounded-lg px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            />
                            <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="bg-white/50 dark:bg-slate-800/50 border border-bg-200 rounded-lg px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            />
                            <select
                                value={editTagId}
                                onChange={(e) => setEditTagId(e.target.value)}
                                className="bg-white/50 dark:bg-slate-800/50 border border-bg-200 rounded-lg px-3 py-2 text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            >
                                <option value="">タグなし</option>
                                {tags.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Image Settings in Edit Mode */}
                        {displayImageUrl && (
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-bg-200/50">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-text-200 mb-1">
                                        <span>POS Y ({editImageOffsetY}%)</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={editImageOffsetY}
                                        onChange={(e) => setEditImageOffsetY(Number(e.target.value))}
                                        className="w-full h-1 bg-bg-200 rounded-lg appearance-none cursor-pointer accent-primary-100"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-text-200 mb-1">
                                        <span>OPACITY ({editImageOpacity}%)</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10" max="100"
                                        value={editImageOpacity}
                                        onChange={(e) => setEditImageOpacity(Number(e.target.value))}
                                        className="w-full h-1 bg-bg-200 rounded-lg appearance-none cursor-pointer accent-primary-100"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleCancel}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                                title="キャンセル"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleSave}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-full transition-colors"
                                title="保存"
                            >
                                <Check size={20} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-2">
                            <h3 className={clsx(
                                "font-black text-xl transition-colors truncate pr-2 tracking-tight flex-1",
                                task.completed ? "text-text-200 line-through" : "text-text-100 drop-shadow-md"
                            )}>
                                {task.title}
                            </h3>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    className="text-text-200 hover:text-primary-100 transition-colors p-1.5 hover:bg-primary-50 rounded-full backdrop-blur-sm bg-white/20 dark:bg-slate-900/40"
                                    title="編集"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(task.id);
                                    }}
                                    className="text-text-200 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full backdrop-blur-sm bg-white/20 dark:bg-slate-900/40"
                                    title="削除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Tag Display (Glassmorphism) */}
                            {tag && (
                                <TagChip tag={tag} onSelectTag={onSelectTag} />
                            )}

                            <span className={clsx(
                                "flex items-center gap-1.5 text-base font-bold drop-shadow-sm",
                                isDeadlinePassed && !task.completed ? "text-red-500" : "",
                                isDueToday && !task.completed ? "text-orange-500" : ""
                            )}>
                                {task.type === 'deadline' ? <Clock size={16} /> : <Calendar size={16} />}
                                {isDueToday ? '今日' : isDueTomorrow ? '明日' : format(date, 'M/d(E)', { locale: ja })}
                                {task.time && <span className="ml-1 text-xs opacity-80">{task.time}</span>}
                            </span>

                            {task.type === 'deadline' && !task.completed && (
                                <span className={clsx(
                                    "text-base font-bold ml-auto drop-shadow-sm",
                                    isDeadlinePassed ? "text-red-500" : "text-text-200"
                                )}>
                                    {isDeadlinePassed ? `${Math.abs(differenceInDays(date, new Date()))}日超過` : `残り${differenceInDays(date, new Date())}日`}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, tags, onToggle, onDelete, onSelectTag, onUpdateTask }) => {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 bg-bg-200 rounded-3xl border-2 border-dashed border-text-200/20">
                <div className="w-16 h-16 bg-bg-300 rounded-full flex items-center justify-center mx-auto mb-4 text-text-200 shadow-sm">
                    <Calendar size={32} />
                </div>
                <p className="text-text-200 font-bold text-lg">タスクがありません</p>
                <p className="text-text-200 text-sm mt-1">新しいタスクを追加して始めましょう</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map(task => (
                <TaskItem
                    key={task.id}
                    task={task}
                    tags={tags}
                    tag={tags.find(g => g.id === task.tagId)}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onSelectTag={onSelectTag}
                    onUpdateTask={onUpdateTask}
                />
            ))}
        </div>
    );
};
