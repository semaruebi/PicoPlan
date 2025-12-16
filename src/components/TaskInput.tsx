import React, { useState, useRef, useEffect } from 'react';
import type { TaskType, Tag, Task } from '../types';
import { Trash2, Plus, Calendar, Clock, ChevronDown, X, Tag as TagIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';
import { CalendarView } from './CalendarView'; // Reuse CalendarView for picker
import { FastAverageColor } from 'fast-average-color';
import { saveImageToDB } from '../utils/imageDb';
import { v4 as uuidv4 } from 'uuid';
import { useImage } from '../hooks/useImage';

interface TaskInputProps {
    tasks: Task[]; // Need existing tasks for calendar dots
    tags: Tag[];
    onAddTask: (title: string, date: string, type: TaskType, tagId?: string, time?: string, imageUrl?: string, imageOffsetY?: number, localImageId?: string, imageOpacity?: number) => void;
    onAddTag: (name: string, themeColor: string, imageUrl?: string, localImageId?: string) => void;
    onDeleteTag: (id: string) => void;
}

// Helper component for tag items
const TagSelectionItem = ({ tag, isSelected, onSelect, onDelete }: { tag: Tag, isSelected: boolean, onSelect: () => void, onDelete: () => void }) => {
    const imageUrl = useImage(tag.localImageId, tag.imageUrl);

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={onSelect}
                className={clsx(
                    "py-1.5 px-3 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all",
                    isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                    <TagIcon size={12} />
                )}
                {tag.name}
            </button>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="削除"
            >
                <X size={10} />
            </button>
        </div>
    );
};

export const TaskInput: React.FC<TaskInputProps> = ({ tasks, tags, onAddTask, onAddTag, onDeleteTag }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(''); // Memo: Not used in Task interface yet, keeping for UI
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [type, setType] = useState<TaskType>('deadline');
    const [selectedTagId, setSelectedTagId] = useState<string>('');
    const [showNewTagInput, setShowNewTagInput] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagImage, setNewTagImage] = useState('');
    const [localNewTagImageId, setLocalNewTagImageId] = useState<string | null>(null);
    const [localNewTagImagePreview, setLocalNewTagImagePreview] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>('#e1bee7');
    const [imageError, setImageError] = useState(false);
    const [taskImage, setTaskImage] = useState('');
    const [localTaskImageId, setLocalTaskImageId] = useState<string | null>(null);
    const [localTaskImagePreview, setLocalTaskImagePreview] = useState<string | null>(null);
    const [taskImageError, setTaskImageError] = useState(false);
    const [taskImageOffsetY, setTaskImageOffsetY] = useState(50); // 50% = center
    const [taskImageOpacity, setTaskImageOpacity] = useState(30); // Default to 30%
    const [showCalendar, setShowCalendar] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Color palette for randomizing tags
    const COLORS = ['#e1bee7', '#bbdefb', '#ffccbc', '#c8e6c9', '#f0f4c3', '#b2dfdb', '#f8bbd0', '#ff8a80', '#ccff90', '#a7ffeb'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date) return;

        // Pass task image if set, else undefined (prioritize local image if exists)
        onAddTask(
            title, date, type,
            selectedTagId || undefined,
            time || undefined,
            taskImage || undefined,
            (taskImage || localTaskImageId) ? taskImageOffsetY : undefined,
            localTaskImageId || undefined,
            (taskImage || localTaskImageId) ? taskImageOpacity : undefined
        );
        setTitle('');
        setDescription('');
        setDate('');
        setTime('');
        setTaskImage('');
        setLocalTaskImageId(null);
        setLocalTaskImagePreview(null);
        setTaskImageOffsetY(50);
        setTaskImageOpacity(30);
        setSelectedTagId('');
        setIsExpanded(false);
        setShowCalendar(false);
    };

    const handleAddTag = () => {
        if (!newTagName.trim()) return;
        onAddTag(
            newTagName.trim(),
            selectedColor,
            newTagImage || undefined,
            localNewTagImageId || undefined
        );
        setNewTagName('');
        setNewTagImage('');
        setLocalNewTagImageId(null);
        setLocalNewTagImagePreview(null);
        setSelectedColor('#e1bee7');
        setShowNewTagInput(false);
    };

    // Click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (title === '' && !date) {
                    setIsExpanded(false);
                }
            }
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [title, date]);

    const handleDateSelect = (selectedDate: Date) => {
        setDate(format(selectedDate, 'yyyy-MM-dd'));
        setShowCalendar(false);
    };

    return (
        <div
            ref={containerRef}
            className={clsx(
                "bg-bg-300 rounded-3xl shadow-sm border border-bg-200 transition-all duration-300 overflow-hidden",
                isExpanded ? "p-6 ring-2 ring-primary-100/20" : "p-2 sm:p-3 flex items-center gap-3 cursor-text hover:shadow-md"
            )}
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            {!isExpanded ? (
                <>
                    <div className="w-10 h-10 rounded-full bg-primary-100/10 flex items-center justify-center text-primary-200 flex-shrink-0">
                        <Plus size={24} />
                    </div>
                    <span className="text-text-200 font-medium">新しいタスクを追加...</span>
                </>
            ) : (
                <form onSubmit={handleSubmit} className="w-full">
                    {/* Header Input */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="タスクのタイトル"
                        className="w-full text-xl sm:text-2xl font-black text-text-100 placeholder-text-200 border-none outline-none bg-transparent mb-4 tracking-tight p-1"
                        autoFocus
                    />

                    <div className={clsx(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isExpanded ? "max-h-[1200px] opacity-100 mt-4" : "max-h-0 opacity-0"
                    )}>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="詳細（オプション）"
                            className="w-full text-sm text-text-100 bg-bg-100 dark:bg-slate-800/50 p-3 rounded-lg border border-bg-200 dark:border-slate-700 focus:outline-none focus:border-primary-100 mb-4 resize-none h-20"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="relative" ref={calendarRef}>
                                <label className="block text-xs font-semibold text-text-200 mb-1 uppercase tracking-wider">期限日 / 予定日</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="flex-1 min-w-[140px] text-sm p-2 rounded-lg border border-bg-200 dark:border-slate-700 text-text-100 focus:outline-none focus:border-primary-100 bg-bg-300 dark:bg-slate-900 flex items-center justify-between whitespace-nowrap"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Calendar size={16} className="text-text-200 flex-shrink-0" />
                                            {date ? format(parseISO(date), 'yyyy/MM/dd') : '日付を選択'}
                                        </span>
                                        <ChevronDown size={14} className="text-text-200 transition-transform duration-200 flex-shrink-0 ml-1" style={{ transform: showCalendar ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </button>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-24 text-sm p-2 rounded-lg border border-bg-200 dark:border-slate-700 text-text-100 focus:outline-none focus:border-primary-100 bg-bg-300 dark:bg-slate-900"
                                    />
                                </div>

                                {/* Custom Date Picker (Inline) */}
                                {showCalendar && (
                                    <div className="mt-2 z-10 w-full shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="bg-bg-300 dark:bg-slate-800 rounded-2xl border border-bg-200 dark:border-slate-700 overflow-hidden">
                                            <CalendarView
                                                tasks={tasks} // Pass tasks for dots
                                                tags={tags}
                                                onSelectDate={handleDateSelect}
                                                compact={true}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-200 mb-1 uppercase tracking-wider">タイプ</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setType('deadline');
                                            if (!date) setDate(format(new Date(), 'yyyy-MM-dd'));
                                        }}
                                        className={clsx(
                                            "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer",
                                            type === 'deadline'
                                                ? "bg-primary-100/10 text-primary-200 border-primary-100 border dark:bg-primary-100/20 shadow-inner"
                                                : "bg-bg-100 dark:bg-slate-800 text-text-200 border border-bg-200 dark:border-slate-700 hover:bg-bg-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        <Clock size={16} /> 締め切り
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setType('scheduled');
                                            if (!date) setDate(format(new Date(), 'yyyy-MM-dd'));
                                        }}
                                        className={clsx(
                                            "flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer",
                                            type === 'scheduled'
                                                ? "bg-primary-100/10 text-primary-200 border-primary-100 border dark:bg-primary-100/20 shadow-inner"
                                                : "bg-bg-100 dark:bg-slate-800 text-text-200 border border-bg-200 dark:border-slate-700 hover:bg-bg-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        <Calendar size={16} /> 予定
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Task Hero Image Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-text-200 mb-1 uppercase tracking-wider">画像 (オプション)</label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="画像のURL (https://...)"
                                    value={taskImage}
                                    onChange={(e) => {
                                        setTaskImage(e.target.value);
                                        setTaskImageError(false);
                                    }}
                                    className="w-full text-sm text-text-100 bg-bg-100 dark:bg-slate-800/50 p-2 rounded-lg border border-bg-200 dark:border-slate-700 focus:outline-none focus:border-primary-100"
                                />

                                <div className="text-center text-xs text-text-200 font-bold my-1">- OR -</div>

                                <div
                                    onPaste={async (e) => {
                                        const items = e.clipboardData.items;
                                        for (const item of items) {
                                            if (item.type.indexOf('image') !== -1) {
                                                const file = item.getAsFile();
                                                if (file) {
                                                    const id = uuidv4();
                                                    await saveImageToDB(id, file);
                                                    setLocalTaskImageId(id);
                                                    setLocalTaskImagePreview(URL.createObjectURL(file));
                                                    setTaskImage('');
                                                    setTaskImageError(false);
                                                }
                                            }
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={async (e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files[0];
                                        if (file && file.type.startsWith('image/')) {
                                            const id = uuidv4();
                                            await saveImageToDB(id, file);
                                            setLocalTaskImageId(id);
                                            setLocalTaskImagePreview(URL.createObjectURL(file));
                                            setTaskImage('');
                                            setTaskImageError(false);
                                        }
                                    }}
                                >
                                    <label className="flex flex-col items-center justify-center gap-2 w-full h-32 px-4 py-6 bg-bg-200 dark:bg-slate-700 hover:bg-bg-300 dark:hover:bg-slate-600 rounded-xl cursor-pointer transition-all border-2 border-dashed border-text-200 hover:border-primary-100 group-hover:bg-bg-300">
                                        <div className="w-10 h-10 rounded-full bg-bg-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                                            <TagIcon size={20} className="text-text-200" />
                                        </div>
                                        <span className="text-sm font-bold text-text-200 text-center">
                                            画像をアップロード<br />
                                            <span className="text-xs opacity-70 font-normal">ドラッグ＆ドロップ または 貼り付け</span>
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const id = uuidv4();
                                                    await saveImageToDB(id, file);
                                                    setLocalTaskImageId(id);
                                                    setLocalTaskImagePreview(URL.createObjectURL(file));
                                                    setTaskImage('');
                                                    setTaskImageError(false);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>

                                {(taskImage || localTaskImagePreview) && !taskImageError && (
                                    <div className="mt-3 space-y-2 animate-in fade-in zoom-in duration-300">
                                        <div className="relative rounded-xl overflow-hidden border border-bg-200 group">
                                            <img
                                                src={localTaskImagePreview || taskImage}
                                                alt="Preview"
                                                className="w-full h-32 object-cover"
                                                onError={() => setTaskImageError(true)}
                                                style={{ objectPosition: `center ${taskImageOffsetY}%` }}
                                            />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 transform translate-y-full group-hover:translate-y-0 transition-transform flex flex-col gap-2">
                                                <div>
                                                    <div className="flex justify-between text-[10px] text-white/80 font-mono mb-1">
                                                        <span>POS Y</span>
                                                        <span>{taskImageOffsetY}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={taskImageOffsetY}
                                                        onChange={(e) => setTaskImageOffsetY(Number(e.target.value))}
                                                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] text-white/80 font-mono mb-1">
                                                        <span>OPACITY</span>
                                                        <span>{taskImageOpacity}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="10"
                                                        max="100"
                                                        value={taskImageOpacity}
                                                        onChange={(e) => setTaskImageOpacity(Number(e.target.value))}
                                                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTaskImage('');
                                                    setLocalTaskImageId(null);
                                                    setLocalTaskImagePreview(null);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-md transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">タグ (オプション)</label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <TagSelectionItem
                                        key={tag.id}
                                        tag={tag}
                                        isSelected={selectedTagId === tag.id}
                                        onSelect={() => setSelectedTagId(selectedTagId === tag.id ? '' : tag.id)}
                                        onDelete={() => {
                                            if (window.confirm(`タグ「${tag.name}」を削除しますか？`)) {
                                                onDeleteTag(tag.id);
                                                if (selectedTagId === tag.id) setSelectedTagId('');
                                            }
                                        }}
                                    />
                                ))}

                                {showNewTagInput ? (
                                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 p-3 bg-bg-100 dark:bg-slate-800 rounded-xl border border-bg-200 dark:border-slate-700 w-full sm:w-auto">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                value={newTagName}
                                                onChange={(e) => setNewTagName(e.target.value)}
                                                placeholder="タグ名"
                                                className="flex-1 text-sm py-2 px-3 rounded-lg border border-bg-200 dark:border-slate-600 bg-bg-300 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-100 text-text-100 min-w-[120px]"
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                value={newTagImage}
                                                onChange={(e) => setNewTagImage(e.target.value)}
                                                placeholder="画像URL (任意)"
                                                className="flex-1 text-sm py-2 px-3 rounded-lg border border-bg-200 dark:border-slate-600 bg-bg-300 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-100 text-text-100 min-w-[120px]"
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                            />
                                            <label className="flex-shrink-0 w-10 flex items-center justify-center bg-bg-200 dark:bg-slate-700 hover:bg-bg-300 dark:hover:bg-slate-600 rounded-lg cursor-pointer transition-colors border border-dashed border-text-200" title="画像をアップロード">
                                                <span className="text-xs font-bold text-text-200">+</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const id = uuidv4();
                                                            await saveImageToDB(id, file);
                                                            setLocalNewTagImageId(id);
                                                            setLocalNewTagImagePreview(URL.createObjectURL(file));
                                                            setNewTagImage('');
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        {/* Color Picker Area */}
                                        <div className="space-y-2">
                                            {/* Preview & Auto Extraction */}
                                            {(newTagImage || localNewTagImagePreview) && !imageError && (
                                                <div className="flex items-center gap-2 p-2 bg-bg-200 dark:bg-slate-700/50 rounded-lg">
                                                    <div className="relative w-8 h-8 flex-shrink-0">
                                                        <img
                                                            src={localNewTagImagePreview || newTagImage}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover rounded-full border border-bg-200"
                                                            onError={() => setImageError(true)}
                                                            onLoad={(e) => {
                                                                // Auto Extract Color
                                                                try {
                                                                    const fac = new FastAverageColor();
                                                                    fac.getColorAsync(e.currentTarget as HTMLImageElement)
                                                                        .then(color => {
                                                                            setSelectedColor(color.hex);
                                                                        })
                                                                        .catch(() => { /* Ignore CORS errors */ });
                                                                } catch (err) { console.error(err); }
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-text-200 truncate flex-1">
                                                        画像から色を抽出します
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                {/* Free Picker */}
                                                <div className="relative group flex-shrink-0">
                                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-bg-200 ring-2 ring-transparent group-hover:ring-primary-100/50 transition-all">
                                                        <input
                                                            type="color"
                                                            value={selectedColor}
                                                            onChange={(e) => setSelectedColor(e.target.value)}
                                                            className="w-[150%] h-[150%] -m-[25%] p-0 cursor-pointer border-none outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Presets */}
                                                {COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setSelectedColor(color)}
                                                        className={clsx(
                                                            "w-5 h-5 rounded-full border border-bg-200 flex-shrink-0 transition-transform",
                                                            selectedColor === color ? "ring-2 ring-primary-100 scale-110" : "hover:scale-105"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={handleAddTag}
                                                disabled={!newTagName.trim()}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-primary-100 hover:bg-primary-200 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                <Plus size={14} /> 追加
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowNewTagInput(false)}
                                                className="flex-1 sm:flex-none px-3 py-2 bg-bg-200 dark:bg-slate-700 text-text-200 hover:bg-bg-300 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center justify-center"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTagInput(true)}
                                        className="py-1.5 px-3 rounded-full text-xs font-medium border border-dashed border-text-200 text-text-200 hover:text-primary-100 hover:border-primary-100 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={12} /> 新規タグ
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-bg-200">
                            <button
                                type="button"
                                onClick={() => {
                                    /* Reset */
                                    setIsExpanded(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-text-200 hover:bg-bg-200 rounded-lg transition-colors hover:scale-105 active:scale-95"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || !date}
                                className="px-6 py-2 text-sm font-bold text-white bg-primary-200 hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-primary-100/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                            >
                                <Plus size={18} />
                                タスクを追加
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};
