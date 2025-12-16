import React, { useState } from 'react';
import type { Task, Tag } from '../types';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface CalendarViewProps {
    tasks: Task[];
    tags: Tag[]; // Changed from games
    onSelectDate: (date: Date) => void;
    compact?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, tags, onSelectDate, compact = false }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const days = eachDayOfInterval({
        start: firstDayOfMonth,
        end: lastDayOfMonth,
    });

    const startDayOfWeek = firstDayOfMonth.getDay();
    const emptyDays = Array(startDayOfWeek).fill(null);

    const nextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(addMonths(currentDate, 1));
    };
    const prevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentDate(subMonths(currentDate, 1));
    };

    return (
        <div className={clsx(
            "bg-bg-300 rounded-3xl overflow-hidden transition-all",
            !compact && "shadow-lg border border-bg-200 p-4 sm:p-6",
            compact && "p-4 w-full"
        )}>
            {/* Header - Material 3 Style */}
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    type="button"
                    onClick={prevMonth}
                    className="w-8 h-8 flex items-center justify-center hover:bg-bg-200 rounded-full transition-colors text-text-200"
                >
                    <ChevronLeft size={20} />
                </button>

                <h2 className="text-base font-bold text-text-100 tracking-tight">
                    {format(currentDate, 'yyyy年 M月', { locale: ja })}
                </h2>

                <button
                    type="button"
                    onClick={nextMonth}
                    className="w-8 h-8 flex items-center justify-center hover:bg-bg-200 rounded-full transition-colors text-text-200"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center mb-2">
                {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                    <div key={d} className={clsx("text-xs font-bold py-1", i === 0 ? "text-red-400" : "text-text-200")}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="w-full h-8 sm:h-10"></div>
                ))}
                {days.map(day => {
                    const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), day));
                    const isToday = isSameDay(day, new Date());

                    // Task dots logic
                    const hasDeadline = dayTasks.some(t => t.type === 'deadline');
                    const hasSchedule = dayTasks.some(t => t.type === 'scheduled');

                    // Check for tags to color dots
                    const tagDots = dayTasks
                        .filter(t => t.tagId)
                        .map(t => tags.find(g => g.id === t.tagId)?.themeColor)
                        .filter(Boolean) as string[];

                    // Unique set of max 3 dots
                    const uniqueDots = Array.from(new Set(tagDots)).slice(0, 3);

                    // Fallback dots if no tag
                    if (uniqueDots.length === 0) {
                        if (hasDeadline) uniqueDots.push('#6366f1'); // Indigo
                        else if (hasSchedule) uniqueDots.push('#10b981'); // Emerald
                    }

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent closing popup immediately
                                onSelectDate(day);
                            }}
                            className={clsx(
                                "flex flex-col relative cursor-pointer group transition-all duration-200 border border-transparent hover:border-indigo-100 dark:hover:border-slate-600 rounded-lg overflow-hidden",
                                compact
                                    ? "w-full h-8 sm:h-10 items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    : "min-h-[80px] sm:min-h-[100px] items-start justify-start p-1 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            {/* Selection/Today Circle */}
                            <div className={clsx(
                                "flex items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                                compact ? "w-6 h-6 sm:w-8 sm:h-8" : "w-6 h-6 self-center mb-1",
                                isToday
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-100"
                                    : "text-slate-700 dark:text-slate-300"
                            )}>
                                {format(day, 'd')}
                            </div>

                            {/* Task Indicators */}
                            {compact ? (
                                /* Compact Mode: Dots */
                                <div className="flex gap-0.5 mt-0.5 h-1 justify-center">
                                    {uniqueDots.map((color, i) => (
                                        <span
                                            key={i}
                                            className="w-1 h-1 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    {uniqueDots.length === 0 && dayTasks.length > 0 && (
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                    )}
                                </div>
                            ) : (
                                /* Full Mode: Task Chips */
                                <div className="w-full flex flex-col gap-1 mt-1">
                                    {dayTasks.slice(0, 3).map(task => { // Show max 3 tasks
                                        const tag = tags.find(g => g.id === task.tagId);
                                        const color = tag?.themeColor || (task.type === 'deadline' ? '#6366f1' : '#10b981');
                                        return (
                                            <div
                                                key={task.id}
                                                className="text-[10px] truncate px-1.5 py-0.5 rounded-sm text-white font-medium bg-opacity-90 hover:bg-opacity-100 transition-opacity"
                                                style={{
                                                    backgroundColor: color,
                                                    textShadow: '0 1px 2px rgba(0,0,0,0.6)' // Ensure readability on light backgrounds
                                                }}
                                            >
                                                {task.title}
                                            </div>
                                        );
                                    })}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[10px] text-slate-400 text-center font-medium">
                                            +{dayTasks.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
