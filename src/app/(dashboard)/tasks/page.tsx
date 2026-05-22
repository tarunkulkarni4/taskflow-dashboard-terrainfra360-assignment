"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  completed: boolean;
}

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Update landing page design", project: "Marketing Website", dueDate: "2026-05-22", priority: "High", completed: false },
  { id: "2", title: "Fix authentication flow bug", project: "Core App", dueDate: "2026-05-23", priority: "High", completed: false },
  { id: "3", title: "Write API documentation", project: "Backend", dueDate: "2026-05-25", priority: "Medium", completed: false },
  { id: "4", title: "Prepare Q3 presentation", project: "Management", dueDate: "2026-05-21", priority: "High", completed: true },
  { id: "5", title: "Setup PostgreSQL database migration", project: "Backend", dueDate: "2026-05-28", priority: "High", completed: false },
  { id: "6", title: "Conduct user feedback sessions", project: "UX Research", dueDate: "2026-05-30", priority: "Low", completed: false },
];

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">("All");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");

  useEffect(() => {
    if (!user) return;

    const minDelay = new Promise<void>(resolve => setTimeout(resolve, 2000));
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    let taskDataBuffer: Task[] = [];
    let isDelayFinished = false;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updated: Task[] = [];
      snapshot.forEach((doc) => {
        updated.push({ id: doc.id, ...doc.data() } as Task);
      });
      taskDataBuffer = updated;
      
      if (isDelayFinished) {
        setTasks(taskDataBuffer);
      }
    });

    minDelay.then(() => {
      isDelayFinished = true;
      setTasks(taskDataBuffer);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTask = async (task: Task) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed, status: !t.completed ? "Done" : "Todo" } : t));
    try {
      await updateDoc(doc(db, "tasks", task.id), { 
        completed: !task.completed,
        status: !task.completed ? "Done" : "Todo"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    try {
      await deleteDoc(doc(db, "tasks", id));
      toast.success("Task deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task.");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    // Save values before clearing
    const title = newTitle;
    const project = newProject || "Personal";
    const dueDate = newDueDate || new Date().toISOString().split("T")[0];
    const priority = newPriority;

    // Optimistically close popup
    setNewTitle("");
    setNewProject("");
    setNewDueDate("");
    setNewPriority("Medium");
    setIsDialogOpen(false);

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        project,
        dueDate,
        priority,
        completed: false,
        status: "Todo",
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Task created!");
    } catch (error) {
      console.error("Error adding task: ", error);
      toast.error("Failed to add task. Check your Firestore rules.");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          task.project.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" ||
                          (filter === "Active" && !task.completed) ||
                          (filter === "Completed" && task.completed);
    return matchesSearch && matchesFilter;
  });

  const priorityColors = {
    High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  } as Record<string, string>;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-500 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        
        <Skeleton className="h-16 w-full rounded-xl" />
        
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/10"><Skeleton className="h-4 w-full" /></div>
          <div className="divide-y p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4 pt-4 first:pt-0">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24 hidden sm:block" />
                <Skeleton className="h-4 w-20 hidden sm:block" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage and track your tasks across all active projects.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-medium hover:bg-primary/95 transition-all shadow-sm cursor-pointer">
            <Plus className="h-5 w-5" />
            Add Task
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTask} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Project</label>
                <Input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="e.g. Core App, Backend" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
                  <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                  <Select value={newPriority} onValueChange={(val: any) => setNewPriority(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/95 transition-all"
              >
                Save Task
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks by name or project..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto self-start sm:self-center">
          {(["All", "Active", "Completed"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                filter === type 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Grid */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Status / Title</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline w-28">Project</span>
            <span className="hidden sm:inline w-24">Due Date</span>
            <span className="w-20 text-center">Priority</span>
            <span className="w-8"></span>
          </div>
        </div>
        <div className="divide-y">
          <AnimatePresence initial={false}>
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-muted-foreground"
              >
                No tasks found. Create a new task or adjust your filters!
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "flex items-center justify-between p-4 transition-colors hover:bg-muted/30",
                    task.completed && "bg-muted/10 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <button onClick={() => toggleTask(task)} className="text-muted-foreground hover:text-primary transition-all">
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/20" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span className={cn(
                      "font-medium text-sm truncate",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <span className="hidden sm:inline w-28 text-muted-foreground font-medium truncate">{task.project}</span>
                    <span className="hidden sm:inline w-24 text-muted-foreground">{task.dueDate}</span>
                    <span className={cn(
                      "w-20 px-2 py-0.5 rounded-full text-xs font-semibold text-center",
                      priorityColors[task.priority]
                    )}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors w-8 h-8 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
