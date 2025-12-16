import React from 'react';
import type { Task, Tag } from '../types';
import { Trash2, Check, Clock, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { hexToRgba } from '../utils/colorUtils';
import { useImage } from '../hooks/useImage';

interface TaskListProps {
    tasks: Task[];
    tags: Tag[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTag?: (tagId: string) => void;
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
const TaskItem = ({ task, tag, onToggle, onDelete, onSelectTag }: { task: Task, tag?: Tag, onToggle: (id: string) => void, onDelete: (id: string) => void, onSelectTag?: (id: string) => void }) => {
    const isDeadlinePassed = task.type === 'deadline' && isPast(parseISO(task.date)) && !isToday(parseISO(task.date)) && !task.completed;
    const isDueToday = isToday(parseISO(task.date));
    const isDueTomorrow = isTomorrow(parseISO(task.date));
    const date = parseISO(task.date);

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
                        className="w-full h-full object-cover opacity-20 dark:opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-105"
                        style={{
                            objectPosition: `center ${task.imageOffsetY ?? 50}%`,
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-300/90 via-bg-300/40 to-transparent dark:from-slate-800/90 dark:via-slate-800/40"></div>
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
                <div className="flex items-start justify-between gap-2">
                    <h3 className={clsx(
                        "font-black text-xl transition-colors truncate pr-2 tracking-tight",
                        task.completed ? "text-text-200 line-through" : "text-text-100"
                    )}>
                        {task.title}
                    </h3>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="text-text-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        title="削除"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Tag Display (Glassmorphism) */}
                    {tag && (
                        <TagChip tag={tag} onSelectTag={onSelectTag} />
                    )}

                    <span className={clsx(
                        "flex items-center gap-1.5 text-base font-bold",
                        isDeadlinePassed && !task.completed ? "text-red-500" : "",
                        isDueToday && !task.completed ? "text-orange-500" : ""
                    )}>
                        {task.type === 'deadline' ? <Clock size={16} /> : <Calendar size={16} />}
                        {isDueToday ? '今日' : isDueTomorrow ? '明日' : format(date, 'M/d(E)', { locale: ja })}
                        {task.time && <span className="ml-1 text-xs opacity-80">{task.time}</span>}
                    </span>

                    {task.type === 'deadline' && !task.completed && (
                        <span className={clsx(
                            "text-base font-bold ml-auto",
                            isDeadlinePassed ? "text-red-500" : "text-text-200"
                        )}>
                            {isDeadlinePassed ? `${Math.abs(differenceInDays(date, new Date()))}日超過` : `残り${differenceInDays(date, new Date())}日`}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, tags, onToggle, onDelete, onSelectTag }) => {
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
                    tag={tags.find(g => g.id === task.tagId)}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onSelectTag={onSelectTag}
                />
            ))}
        </div>
    );
};
