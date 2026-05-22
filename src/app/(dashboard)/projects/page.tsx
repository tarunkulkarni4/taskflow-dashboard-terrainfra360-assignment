"use client";

import { useState, useEffect } from "react";
import { Folder, MoreVertical, Plus, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  createdAt: any;
  userId: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const minDelay = new Promise<void>(resolve => setTimeout(resolve, 2000));
    const q = query(collection(db, "projects"), where("userId", "==", user.uid));
    let projDataBuffer: Project[] = [];
    let isDelayFinished = false;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updated: Project[] = [];
      snapshot.forEach((doc) => {
        updated.push({ id: doc.id, ...doc.data() } as Project);
      });
      projDataBuffer = updated;

      if (isDelayFinished) {
        setProjects([...projDataBuffer].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      }
    });

    minDelay.then(() => {
      isDelayFinished = true;
      setProjects([...projDataBuffer].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;

    // Optimistically close dialog and clear name
    const projectName = newName;
    setNewName("");
    setIsDialogOpen(false);

    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Project created!");
    } catch (error) {
      console.error("Error adding project: ", error);
      toast.error("Failed to add project. Check your Firestore rules.");
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast("Delete this project?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteDoc(doc(db, "projects", id));
            toast.success("Project deleted.");
          } catch (error) {
            console.error("Error deleting project: ", error);
            toast.error("Failed to delete project.");
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 flex flex-col justify-between h-[160px] shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-6 w-6 rounded-md" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Organize and monitor all of your initiatives.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 font-medium hover:bg-primary/95 transition-all shadow-sm cursor-pointer">
            <Plus className="h-5 w-5" />
            Add Project
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProject} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Project Name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Marketing Redesign" required />
              </div>
              <button 
                type="submit" 
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 font-medium hover:bg-primary/95 transition-all"
              >
                Save Project
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground shadow-sm">
          No projects found. Create one to get started!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const dateStr = project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : "Just now";
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow h-full flex flex-col justify-between cursor-pointer group">
                    <CardHeader className="flex flex-row items-start justify-between pb-4">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
                          <Folder className="h-5 w-5 text-primary" />
                          {project.name}
                        </CardTitle>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteProject(e, project.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardHeader>
                    
                    <CardContent className="pt-0 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Created {dateStr}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
