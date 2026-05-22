"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { MoreHorizontal, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const INITIAL_TASKS = [
  {
    id: "1",
    title: "Update landing page design",
    project: "Marketing Website",
    dueDate: "Today",
    priority: "High",
    status: "In Progress",
    assignee: "https://github.com/shadcn.png",
    completed: false,
  },
  {
    id: "2",
    title: "Fix authentication flow bug",
    project: "Core App",
    dueDate: "Tomorrow",
    priority: "Critical",
    status: "To Do",
    assignee: "https://github.com/shadcn.png",
    completed: false,
  },
  {
    id: "3",
    title: "Write API documentation",
    project: "Backend",
    dueDate: "Oct 24",
    priority: "Medium",
    status: "To Do",
    assignee: "https://github.com/shadcn.png",
    completed: false,
  },
  {
    id: "4",
    title: "Prepare Q3 presentation",
    project: "Management",
    dueDate: "Oct 25",
    priority: "High",
    status: "In Progress",
    assignee: "https://github.com/shadcn.png",
    completed: true,
  },
];

export function TaskList() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const priorityColors: Record<string, string> = {
    "Critical": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "High": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "Medium": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Low": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">Recent Tasks</h3>
        <button className="text-sm font-medium text-primary hover:underline">View all</button>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="divide-y">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "flex items-center gap-4 p-4 transition-colors hover:bg-muted/50",
                  task.completed && "opacity-60 bg-muted/20"
                )}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="h-5 w-5 rounded-full"
                />
                
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center justify-between">
                  <div>
                    <p className={cn(
                      "font-medium text-sm transition-all",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="font-medium">{task.project}</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50"></span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <div className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", priorityColors[task.priority])}>
                      {task.priority}
                    </div>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded-md hover:bg-muted text-muted-foreground outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit task</DropdownMenuItem>
                        <DropdownMenuItem>Change status</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
