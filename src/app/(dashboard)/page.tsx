"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Clock, AlertCircle, Plus } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Link from "next/link";

const TextType = dynamic(() => import("@/components/ui/TextType"), { ssr: false });

interface Task {
  id: string;
  title: string;
  status: "Todo" | "In Progress" | "Done";
  dueDate: string;
  project?: string;
  projectId?: string;
  createdAt?: any;
}

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");

  useEffect(() => {
    if (!user) return;

    // Minimum 2 second skeleton display
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

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projects Skeleton */}
          <div className="rounded-xl border bg-card p-6 flex flex-col gap-4 shadow-sm">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2 p-4 border rounded-lg">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Skeleton */}
          <div className="rounded-xl border bg-card p-6 flex flex-col gap-4 shadow-sm">
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-5 w-5 rounded-md shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-full max-w-[250px]" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  
  // Completed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeek = tasks.filter(t => t.status === "Done").length; // A real app would check the completion date, using status for now

  // Overdue
  const today = new Date().toISOString().split("T")[0];
  const overdueTasks = tasks.filter(t => t.status !== "Done" && t.dueDate < today).length;

  // Chart data
  const todoCount = tasks.filter(t => t.status === "Todo").length;
  const inProgressCount = tasks.filter(t => t.status === "In Progress").length;
  const doneCount = tasks.filter(t => t.status === "Done").length;

  const chartData = [
    { name: "To Do", value: todoCount, color: "hsl(var(--muted-foreground))" },
    { name: "In Progress", value: inProgressCount, color: "hsl(var(--primary))" },
    { name: "Done", value: doneCount, color: "hsl(142.1 76.2% 36.3%)" }, // Emerald 600
  ].filter(d => d.value > 0);

  const projectMap = tasks.reduce((acc, task) => {
    const projName = task.project || "Personal";
    if (!acc[projName]) {
      acc[projName] = {
        name: projName,
        projectId: task.projectId || "",
        tasks: 0,
        completed: 0,
        createdAt: task.createdAt,
      };
    }
    acc[projName].tasks += 1;
    if (task.status === "Done") acc[projName].completed += 1;
    
    if (task.createdAt && (!acc[projName].createdAt || (task.createdAt.seconds < acc[projName].createdAt.seconds))) {
      acc[projName].createdAt = task.createdAt;
    }

    return acc;
  }, {} as Record<string, { name: string, projectId: string, tasks: number, completed: number, createdAt: any }>);

  const projectsList = Object.values(projectMap).sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 h-6">
          <TextType
            as="span"
            text={[
              "Welcome back! Here's an overview of your work.",
              "Stay on top of your tasks and projects.",
              `You have ${totalTasks} task${totalTasks !== 1 ? "s" : ""} in progress.`,
              overdueTasks > 0 ? `${overdueTasks} task${overdueTasks !== 1 ? "s" : ""} need your attention!` : "Great job, no overdue tasks!",
            ]}
            typingSpeed={45}
            deletingSpeed={25}
            pauseDuration={2500}
            showCursor={true}
            cursorCharacter="|"
            cursorClassName="text-primary"
            className="text-sm"
            variableSpeed={{ min: 40, max: 60 }}
            onSentenceComplete={() => {}}
          />
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatsCard
          title="Total Tasks"
          value={totalTasks.toString()}
          description="All time tasks"
          icon={CheckSquare}
          trend="neutral"
          trendValue=""
          delay={0.1}
        />
        <StatsCard
          title="Completed"
          value={completedThisWeek.toString()}
          description="Tasks completed"
          icon={CheckSquare}
          trend="up"
          trendValue="Good!"
          delay={0.2}
        />
        <StatsCard
          title="Overdue"
          value={overdueTasks.toString()}
          description="Requires attention"
          icon={AlertCircle}
          trend={overdueTasks > 0 ? "down" : "neutral"}
          trendValue={overdueTasks > 0 ? "Action needed" : "All clear"}
          delay={0.3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No tasks to display.
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tasks Section */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>My Tasks</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger className="flex items-center justify-center p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Add Task">
                <Plus className="h-4 w-4" />
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
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks found. Create one!</p>
            ) : (
              tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <CheckSquare className={`h-4 w-4 shrink-0 ${task.status === "Done" ? "text-emerald-500" : "text-muted-foreground"}`} />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <p className={`text-sm font-medium truncate ${task.status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.projectId ? (
                        <Link href={`/projects/${task.projectId}`} className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition-colors">
                          {task.project || "Personal"}
                        </Link>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-600">
                          {task.project || "Personal"}
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Projects Section */}
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet.</p>
            ) : (
              projectsList.slice(0, 5).map(proj => {
                let status = "Planning";
                let statusColor = "bg-orange-500/10 text-orange-600";
                let dotColor = "bg-orange-500";
                
                if (proj.completed === proj.tasks) {
                  status = "Completed";
                  statusColor = "bg-emerald-500/10 text-emerald-600";
                  dotColor = "bg-emerald-500";
                } else if (proj.completed > 0) {
                  status = "In Progress";
                  statusColor = "bg-blue-500/10 text-blue-600";
                  dotColor = "bg-blue-500";
                }

                const dateStr = proj.createdAt && typeof proj.createdAt.toDate === "function"
                  ? proj.createdAt.toDate().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                  : "N/A";

                return (
                  <Link key={proj.name} href={proj.projectId ? `/projects/${proj.projectId}` : "/projects"} className="flex flex-col gap-2 p-3.5 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer block">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{proj.name}</p>
                      <span className={`h-2 w-2 rounded-full ${dotColor}`}></span>
                    </div>
                    <p className="text-xs text-muted-foreground flex justify-between items-center">
                      <span>{proj.completed}/{proj.tasks} tasks completed</span>
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className={`text-[10px] ${statusColor} px-1.5 py-0.5 rounded-sm font-medium`}>{status}</span>
                      <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
