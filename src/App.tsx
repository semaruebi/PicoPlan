import { useState, useMemo, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskInput } from './components/TaskInput';
import { TaskList } from './components/TaskList';
import { CalendarView } from './components/CalendarView';
import { CheckSquare, Calendar as CalendarIcon, Moon, Sun, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { isSameDay, parseISO, isToday, format } from 'date-fns';
import { ja } from 'date-fns/locale';

function App() {
  const { tasks, tags, addTask, toggleTask, deleteTask, addTag, deleteTag } = useTasks();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const handleReset = () => {
    setSelectedDate(null);
    setSelectedTagFilter(null);
    setView('list');
  };

  const handleDateSelect = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null); // Deselect if same date clicked
    } else {
      setSelectedDate(date);
    }
    setView('list'); // Switch to list view to show tasks for that date
  };

  // Filter Logic
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by Date
    if (selectedDate) {
      result = result.filter(t => isSameDay(parseISO(t.date), selectedDate));
    }
    // Default visibility logic (if not date selected)
    else if (!selectedTagFilter) {
      // Only show relevant tasks if no specific filter is active?
      // Current logic: Show everything unless filtered by date or tag?
      // Original logic was showing deadline tasks up to date, and scheduled tasks 3 days before.
      // Let's keep it simple: Show all incomplete tasks + recent completed ones?
      // Or stick to the original "Dashboard" logic?
      // User didn't complain about the list. Let's stick to simple "All tasks" sorted, 
      // or maybe just keep the original hook logic if I didn't remove `getVisibleTasks`.
      // Wait, I removed `getVisibleTasks` from export in useTasks refactor? 
      // Let me check. I might have lost it.
      // Actually `useTasks` returned `tasks`. I should sort them in the UI.
      result = result.sort((a, b) => {
        if (a.completed === b.completed) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return a.completed ? 1 : -1;
      });
    }

    // Filter by Tag
    if (selectedTagFilter) {
      result = result.filter(t => t.tagId === selectedTagFilter);
    }

    return result;
  }, [tasks, selectedDate, selectedTagFilter]);

  // Today's deadlines for Alert
  const todaysDeadlines = useMemo(() => {
    return tasks.filter(t =>
      t.type === 'deadline' &&
      !t.completed &&
      isToday(parseISO(t.date))
    );
  }, [tasks]);

  const activeTag = tags.find(t => t.id === selectedTagFilter);

  return (
    <div className="min-h-screen bg-bg-100 text-text-100 transition-colors duration-300 font-sans">
      <div className="md:max-w-4xl max-w-md mx-auto min-h-screen bg-bg-300 dark:bg-bg-100 shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300">

        {/* Header */}
        <header className="bg-bg-300/80 backdrop-blur-md sticky top-0 z-20 border-b border-bg-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
              <CheckSquare className="text-white" size={24} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-primary-200 tracking-tight group-hover:text-primary-100 transition-colors">Pico Plan</h1>
              <p className="text-[10px] font-bold text-text-200 tracking-widest uppercase">Personal Schedule</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-text-200 hover:bg-bg-200 transition-colors"
            >
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* View Date Indicator (if selected) */}
            {selectedDate && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100/10 text-primary-200 rounded-full text-xs font-bold">
                <span>{selectedDate.getMonth() + 1}/{selectedDate.getDate()}</span>
                <button onClick={() => setSelectedDate(null)} className="hover:text-primary-100">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-hide">

          {/* Date Card */}
          <div className="mb-6">
            <div className="bg-bg-300 dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-bg-200 dark:border-slate-700 shadow-xl flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-primary-100 dark:text-primary-200 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
                <CalendarIcon size={120} />
              </div>

              <div>
                <p className="text-sm font-bold text-text-200 mb-1 uppercase tracking-wider">
                  {selectedDate ? 'Selected Date' : 'Today'}
                </p>
                <h2 className="text-4xl font-black text-text-100 tracking-tight">
                  {format(selectedDate || new Date(), 'M月d日', { locale: ja })}
                </h2>
                <p className="text-lg font-bold text-primary-200 mt-1">
                  {format(selectedDate || new Date(), 'EEEE', { locale: ja })}
                </p>
              </div>

              {selectedDate && (
                <button
                  onClick={handleReset}
                  className="z-10 bg-bg-200 hover:bg-bg-100 text-text-200 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* View Switcher */}
          <div className="bg-bg-200 p-1 rounded-2xl flex mb-6">
            <button
              onClick={() => { setView('list'); setSelectedDate(null); }}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                view === 'list'
                  ? "bg-bg-300 text-text-100 shadow-sm"
                  : "text-text-200 hover:text-text-100"
              )}
            >
              <CheckSquare size={18} /> リスト
            </button>
            <button
              onClick={() => setView('calendar')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                view === 'calendar'
                  ? "bg-bg-300 text-text-100 shadow-sm"
                  : "text-text-200 hover:text-text-100"
              )}
            >
              <CalendarIcon size={18} /> カレンダー
            </button>
          </div>

          {/* Content */}
          {view === 'list' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Deadline Alert */}
              {todaysDeadlines.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-4 animate-pulse">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
                    <AlertTriangle size={18} />
                    <span className="font-bold">今日が締め切りです！</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-300 pl-6">
                    {todaysDeadlines.length}件のタスクが今日期限です。頑張りましょう！
                  </p>
                </div>
              )}

              {/* Filter Indicator/Clearer */}
              {selectedTagFilter && activeTag && (
                <div className="flex items-center justify-between bg-bg-300 p-3 rounded-xl border border-bg-200 shadow-sm mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTag.themeColor }}></div>
                    <span className="font-bold text-sm">タグ: {activeTag.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedTagFilter(null)}
                    className="text-xs bg-bg-100 text-text-200 px-2 py-1 rounded-md hover:bg-bg-200 transition-colors"
                  >
                    解除
                  </button>
                </div>
              )}

              <TaskInput
                tasks={tasks} // Pass all tasks for calendar dots calculation
                tags={tags}
                onAddTask={addTask}
                onAddTag={addTag}
                onDeleteTag={deleteTag}
              />

              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold text-text-200 uppercase tracking-wider">
                    {selectedDate ? 'Selected Date' : selectedTagFilter ? 'Filtered Tasks' : 'All Tasks'}
                  </h2>
                  {filteredTasks.length > 0 && (
                    <span className="text-xs font-medium text-text-200 bg-bg-200 px-2 py-0.5 rounded-full">
                      {filteredTasks.length}
                    </span>
                  )}
                </div>

                <TaskList
                  tasks={filteredTasks}
                  tags={tags}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onSelectTag={(tagId) => {
                    setSelectedTagFilter(tagId);
                    setView('list'); // Ensure we are in list view
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-300">
              <CalendarView
                tasks={tasks}
                tags={tags}
                onSelectDate={handleDateSelect}
              />
              <div className="mt-8 p-4 bg-primary-100/10 rounded-xl text-center text-sm text-primary-200 font-medium">
                日付をタップするとその日のリストを表示します
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;
