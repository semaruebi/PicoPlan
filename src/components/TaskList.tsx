import type { Task, Tag } from '../types';
import { Check, Clock, Trash2, Calendar, Tag as TagIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TaskListProps {
    tasks: Task[];
    tags: Tag[]; // Changed from Games
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTag?: (tagId: string) => void; // New prop for filtering
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, tags, onToggle, onDelete, onSelectTag }) => {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-600">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                    <Check size={48} className="opacity-50" />
                </div>
                <p className="font-medium">タスクはありません</p>
                <p className="text-sm mt-2">新しいタスクを追加して始めましょう</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map(task => {
                const date = parseISO(task.date);
                const isDeadlinePassed = task.type === 'deadline' && isPast(date) && !isToday(date) && !task.completed;
                const isDueToday = isToday(date);
                const isDueTomorrow = isTomorrow(date);
                const daysLeft = differenceInDays(date, new Date());

                const tag = tags.find(g => g.id === task.tagId);

                return (
                    <div
                        key={task.id}
                        className={clsx(
                            "group relative flex items-center gap-3 p-4 bg-bg-300 rounded-2xl border-2 transition-all duration-300 ease-in-out",
                            task.completed
                                ? "border-bg-200 bg-bg-100 dark:border-slate-800"
                                : "hover:shadow-lg hover:border-primary-100 border-bg-200 dark:border-slate-700 hover:scale-[1.02] active:scale-[0.98]",
                            isDeadlinePassed && !task.completed && "border-l-4 border-l-red-400"
                        )}
                        style={
                            !isDeadlinePassed && !task.completed && tag ? { borderLeft: `4px solid ${tag.themeColor}` } : {}
                        }
                    >
                        <button
                            onClick={() => onToggle(task.id)}
                            className={clsx(
                                "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                task.completed
                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                    : "border-text-200 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-transparent"
                            )}
                        >
                            <Check size={14} className={clsx("transition-transform", task.completed ? "scale-100" : "scale-0")} />
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className={clsx(
                                    "font-bold text-base transition-colors truncate pr-2",
                                    task.completed ? "text-text-200 line-through" : "text-text-100"
                                )}>
                                    {task.title}
                                </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1 text-xs font-medium text-text-200">
                                <span className={clsx(
                                    "flex items-center gap-1",
                                    isDeadlinePassed && !task.completed ? "text-red-500 font-bold" : "",
                                    isDueToday && !task.completed ? "text-orange-500 font-bold" : ""
                                )}>
                                    {task.type === 'deadline' ? <Clock size={12} /> : <Calendar size={12} />}
                                    {isDueToday ? '今日' : isDueTomorrow ? '明日' : format(date, 'M/d(E)', { locale: ja })}
                                    {task.time && <span className="ml-1 text-[10px] opacity-80">{task.time}</span>}
                                </span>

                                {tag && (
                                    <span
                                        className={clsx(
                                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors bg-current/10 dark:bg-current/20",
                                            onSelectTag && "cursor-pointer hover:bg-current/20 dark:hover:bg-current/30"
                                        )}
                                        style={{
                                            color: tag.themeColor
                                        }}
                                        onClick={(e) => {
                                            if (onSelectTag) {
                                                e.stopPropagation();
                                                onSelectTag(tag.id);
                                            }
                                        }}
                                    >
                                        {tag.imageUrl ? (
                                            <img src={tag.imageUrl} alt="" className="w-3 h-3 rounded-full object-cover" />
                                        ) : (
                                            <TagIcon size={10} style={{ fill: 'currentColor' }} />
                                        )}
                                        <span className="brightness-75 dark:brightness-110 saturate-150">{tag.name}</span>
                                    </span>
                                )}

                                {!task.completed && task.type === 'deadline' && (
                                    <span className={clsx(
                                        "ml-auto",
                                        daysLeft <= 3 ? "text-red-400" : "text-slate-300"
                                    )}>
                                        残り{daysLeft < 0 ? 0 : daysLeft}日
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => onDelete(task.id)}
                            className="bg-transparent text-text-200 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="削除"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
