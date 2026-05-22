"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface CalendarTask {
  id: string;
  title: string;
  project?: string;
  dueDate: string;
  completed: boolean;
  status?: string;
  priority: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { user } = useAuth();
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split("T")[0]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData: CalendarTask[] = [];
      snapshot.forEach((doc) => {
        taskData.push({ id: doc.id, ...doc.data() } as CalendarTask);
      });
      setTasks(taskData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getFullDateString = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const getTasksForDay = (day: number | null) => {
    if (!day) return [];
    return tasks.filter((t) => t.dueDate === getFullDateString(day));
  };

  const activeDateTasks = tasks.filter((t) => t.dueDate === selectedDate);

  const isToday = (day: number) => {
    return getFullDateString(day) === today.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 w-full animate-in fade-in duration-500">
        <div>
          <Skeleton className="h-9 w-36 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="col-span-2 rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-8 w-40 mb-6" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-16 sm:h-20 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <Skeleton className="h-6 w-32" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 p-3 border rounded-xl">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Check scheduled deadlines and manage project timetables.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Interactive Calendar */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">
                {monthNames[month]} {year}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrevMonth} className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-muted-foreground mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-16 sm:h-20 bg-muted/10 rounded-lg" />;
                }

                const dateStr = getFullDateString(day);
                const isSelected = selectedDate === dateStr;
                const todayFlag = isToday(day);
                const tasksForDay = getTasksForDay(day);
                const hasTasks = tasksForDay.length > 0;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "h-16 sm:h-20 flex flex-col justify-between p-2 rounded-lg border text-left transition-all hover:bg-muted/50",
                      isSelected && "ring-2 ring-primary bg-primary/5 border-primary/50",
                      todayFlag && !isSelected && "border-primary bg-primary/5",
                      !isSelected && !todayFlag && "bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={cn(
                        "text-xs font-semibold h-5 w-5 rounded-full flex items-center justify-center",
                        todayFlag && "bg-primary text-primary-foreground font-bold",
                        isSelected && !todayFlag && "bg-primary/20 text-primary"
                      )}>
                        {day}
                      </span>
                    </div>

                    {hasTasks && (
                      <div className="w-full space-y-1">
                        <div className="flex gap-1 overflow-x-hidden">
                          {tasksForDay.map((task) => (
                            <span
                              key={task.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full block flex-shrink-0",
                                task.priority === "Critical" && "bg-red-500",
                                task.priority === "High" && "bg-orange-500",
                                task.priority === "Medium" && "bg-blue-500",
                                task.priority === "Low" && "bg-gray-400"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-full font-medium">
                          {tasksForDay.length} {tasksForDay.length === 1 ? "task" : "tasks"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Agenda */}
        <Card className="col-span-1 shadow-sm flex flex-col">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-bold">Agenda Overview</CardTitle>
            <CardDescription>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long", month: "short", day: "numeric", year: "numeric",
              })}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-y-auto min-h-[300px]">
            <motion.div key={selectedDate} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 h-full">
              {activeDateTasks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-muted-foreground py-8">
                  <div>
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm">No tasks scheduled for this day.</p>
                  </div>
                </div>
              ) : (
                activeDateTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors flex items-start gap-3">
                    <div className="mt-0.5">
                      {task.completed || task.status === "Done" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className={cn(
                        "text-sm font-semibold",
                        (task.completed || task.status === "Done") && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h4>
                      {task.project && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">{task.project}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 font-bold rounded-full",
                          task.priority === "Critical" && "bg-red-100 text-red-700",
                          task.priority === "High" && "bg-orange-100 text-orange-700",
                          task.priority === "Medium" && "bg-blue-100 text-blue-700",
                          task.priority === "Low" && "bg-gray-100 text-gray-700"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
