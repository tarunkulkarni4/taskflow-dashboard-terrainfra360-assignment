"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: "Todo" | "In Progress" | "Done";
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  projectId: string;
  userId: string;
  createdAt: any;
}

export default function ProjectDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const projectId = params.id as string;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("Loading Project...");
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newStatus, setNewStatus] = useState<"Todo" | "In Progress" | "Done">("Todo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !projectId) return;

    // Fetch project name
    const fetchProject = async () => {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setProjectName(docSnap.data().name);
      } else {
        setProjectName("Project not found");
      }
    };
    fetchProject();

    // Subscribe to tasks
    const q = query(
      collection(db, "tasks"), 
      where("userId", "==", user.uid),
      where("projectId", "==", projectId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData: Task[] = [];
      snapshot.forEach((doc) => {
        taskData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(taskData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, projectId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "tasks"), {
        title: newTitle,
        status: newStatus,
        dueDate: newDueDate || new Date().toISOString().split("T")[0],
        priority: newPriority,
        projectId: projectId,
        project: projectName,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Task added to project!");
      setNewTitle("");
      setNewDueDate("");
      setNewPriority("Medium");
      setNewStatus("Todo");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding task: ", error);
      toast.error("Failed to add task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const cycle: Record<string, "Todo" | "In Progress" | "Done"> = { "Todo": "In Progress", "In Progress": "Done", "Done": "Todo" };
      const newStatus = cycle[task.status] ?? "Todo";
      await updateDoc(doc(db, "tasks", task.id), { status: newStatus });
    } catch (error) {
      console.error("Error updating task: ", error);
      toast.error("Failed to update task.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    toast("Delete this task?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteDoc(doc(db, "tasks", id));
            toast.success("Task deleted.");
          } catch (error) {
            console.error("Error deleting task: ", error);
            toast.error("Failed to delete task.");
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  const priorityColors = {
    High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6">
      <Link href="/projects" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{projectName}</h1>
          <p className="text-muted-foreground mt-1">Manage tasks for this project.</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todo">Todo</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
                  <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
                </div>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/95 transition-all disabled:opacity-70">
                {isSubmitting ? <Spinner className="text-primary-foreground" /> : "Save Task"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/10 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Status / Title</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline w-24">Due Date</span>
            <span className="w-20 text-center">Priority</span>
            <span className="w-8"></span>
          </div>
        </div>
        <div className="divide-y">
          <AnimatePresence initial={false}>
            {tasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-muted-foreground"
              >
                No tasks yet. Add one!
              </motion.div>
            ) : (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "flex items-center justify-between p-4 transition-colors hover:bg-muted/30",
                    task.status === "Done" && "bg-muted/10 opacity-70"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                    <button onClick={() => toggleTaskStatus(task)} className="text-muted-foreground hover:text-primary transition-all">
                      {task.status === "Done" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/20" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span className={cn(
                      "font-medium text-sm truncate",
                      task.status === "Done" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-8 text-sm">
                    <span className="hidden sm:inline w-24 text-muted-foreground">{task.dueDate}</span>
                    <span className={cn(
                      "w-20 px-2 py-0.5 rounded-full text-xs font-semibold text-center",
                      priorityColors[task.priority]
                    )}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
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
