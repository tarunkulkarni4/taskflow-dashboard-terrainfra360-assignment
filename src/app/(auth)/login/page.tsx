"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  CheckSquare,
  Loader2,
  Mail,
  Lock,
  User,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SplitText } from "@/components/ui/SplitText";
import { BlurText } from "@/components/ui/BlurText";
import dynamic from "next/dynamic";
import { toast } from "sonner";

interface LightPillarProps {
  topColor?: string;
  bottomColor?: string;
  intensity?: number;
  rotationSpeed?: number;
  glowAmount?: number;
  pillarWidth?: number;
  pillarHeight?: number;
  noiseIntensity?: number;
  pillarRotation?: number;
  interactive?: boolean;
  mixBlendMode?: string;
  quality?: "low" | "medium" | "high";
}

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
}

const LightPillar = dynamic<LightPillarProps>(() => import("@/components/ui/LightPillar"), { ssr: false });
const DotField = dynamic<DotFieldProps>(() => import("@/components/ui/DotField"), { ssr: false });

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back! Signing you in...");
        router.push("/");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          name: name || "New User",
          email: cred.user.email,
        });
        toast.success("Account created! Welcome aboard 🎉");
        router.push("/");
      }
    } catch (err: any) {
      const msg = err.message || "Authentication failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSsoLoading("google");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await setDoc(
        doc(db, "users", result.user.uid),
        { name: result.user.displayName || "Google User", email: result.user.email },
        { merge: true }
      );
      toast.success(`Welcome, ${result.user.displayName || "User"}! 👋`);
      router.push("/");
    } catch (err: any) {
      const msg = err.message || "Google sign-in failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSsoLoading(null);
    }
  };

  return (
    <div className="flex relative h-screen w-full overflow-hidden font-sans bg-[#080b12]">

      {/* ══ BACKGROUND: dark LightPillar panel ══ */}
      <div className="absolute inset-0 lg:relative flex flex-col text-white overflow-hidden lg:w-[62%] h-full z-0">
        <LightPillar
          topColor="#6366f1"
          bottomColor="#a855f7"
          intensity={1.1}
          rotationSpeed={0.25}
          glowAmount={0.006}
          pillarWidth={3.5}
          pillarHeight={0.35}
          noiseIntensity={0.3}
          pillarRotation={0}
          interactive={false}
          mixBlendMode="screen"
          quality="medium"
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,transparent_25%,rgba(8,11,18,0.65)_100%)] pointer-events-none" />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="relative z-10 hidden lg:flex flex-col justify-between h-full px-12 py-10">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-950 shadow-lg shadow-black/40">
              <CheckSquare className="h-[18px] w-[18px]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">TaskFlow</span>
          </div>

          {/* Hero */}
          <div className="space-y-5 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/25">
              Interactive Dashboard
            </span>
            <h2 className="text-[40px] font-extrabold leading-[1.12] tracking-tight text-white drop-shadow-xl">
              <SplitText text="Organize tasks." className="block" delay={55} duration={0.5} from={{ opacity: 0, y: 40 }} to={{ opacity: 1, y: 0 }} />
              <SplitText text="Accelerate your workflow." className="block" delay={50} duration={0.5} from={{ opacity: 0, y: 40 }} to={{ opacity: 1, y: 0 }} />
            </h2>
            <p className="text-sm text-zinc-300 font-light leading-relaxed max-w-sm">
              TaskFlow is the elite hub for creators, developers, and teams to plan, manage, and execute projects seamlessly.
            </p>

            {/* Mini task card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="p-4 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/10 shadow-xl max-w-[290px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-zinc-400">Current Task</span>
                </div>
                <span className="text-[9px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded-full font-semibold">In Progress</span>
              </div>
              <p className="text-xs font-bold text-white mb-0.5">Build TaskFlow Dashboard UI</p>
              <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">Complete premium drag-and-drop kanban board with Firebase.</p>
              <div className="space-y-1.5">
                {["Integrate Framer Motion transitions", "Implement dark mode variables"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-[10px] text-zinc-300">
                    <CheckSquare className="h-3 w-3 text-indigo-400 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <div className="flex -space-x-1">
                  {[["JD","bg-indigo-500"],["AM","bg-purple-500"]].map(([i,c]) => (
                    <div key={i} className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold ring-1 ring-black/30 text-white ${c}`}>{i}</div>
                  ))}
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">Updated 2m ago</span>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-zinc-600">© {new Date().getFullYear()} TaskFlow Inc. All rights reserved.</p>
        </div>
      </div>

      {/* ══ FOREGROUND: solid white auth panel ══ */}
      <div className="relative z-20 flex flex-col justify-center items-center bg-white overflow-hidden lg:border-l lg:border-zinc-100 w-full h-full lg:w-[38%] lg:min-w-[340px]">
        {/* Subtle DotField background for light panel */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <DotField
            dotRadius={1.5}
            dotSpacing={16}
            bulgeStrength={50}
            glowRadius={130}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(99,102,241,0.2)"
            gradientTo="rgba(168,85,247,0.12)"
            glowColor="rgba(99,102,241,0.08)"
          />
        </div>
        {/* Top-right glow accent */}
        <div className="absolute -top-20 -right-16 h-60 w-60 rounded-full bg-indigo-50 blur-3xl pointer-events-none z-[1]" />

        {/* Scrollable content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-8 py-8 overflow-y-auto">
          <div className="w-full max-w-[340px]">

            {/* Logo */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-lg">
                <CheckSquare className="h-6 w-6" />
              </div>
              <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">TaskFlow</span>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h1 className="text-[28px] font-bold text-zinc-900 leading-none tracking-tight">
                {isLogin ? "Sign in" : "Create account"}
              </h1>
              <p className="text-[13px] text-zinc-500 mt-3">
                {isLogin ? "New user? " : "Have an account? "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  {isLogin ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {!isLogin && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        required={!isLogin}
                        className="h-11 pl-9 text-sm rounded-xl border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="h-11 pl-9 text-sm rounded-xl border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="h-11 pl-9 pr-10 text-sm rounded-xl border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Forgot password */}
              {isLogin && (
                <div className="pt-0.5">
                  <a href="#" className="text-[13px] text-blue-600 font-semibold hover:underline">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-xl p-3"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || ssoLoading !== null}
                className="w-full h-11 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              >
                {loading ? <Spinner className="text-white" /> : (isLogin ? "Login" : "Sign Up")}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 flex items-center">
              <div className="flex-1 border-t border-zinc-200" />
              <span className="mx-3 text-[11px] text-zinc-400 font-medium">or</span>
              <div className="flex-1 border-t border-zinc-200" />
            </div>

            {/* Social */}
            <div className="space-y-3.5">
              <p className="text-center text-[12px] text-zinc-500 font-medium">
                Join with your favorite social media account
              </p>
              <div className="flex justify-center gap-3">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={!!ssoLoading || loading}
                  title="Google"
                  className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                >
                  {ssoLoading === "google" ? <Spinner className="text-zinc-600" /> : (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                </button>

                {/* Facebook */}
                <button type="button" onClick={() => alert("Facebook coming soon.")} title="Facebook"
                  className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                  <svg className="h-[18px] w-[18px] text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>

                {/* X */}
                <button type="button" onClick={() => alert("X coming soon.")} title="X (Twitter)"
                  className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                  <svg className="h-4 w-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                {/* Apple */}
                <button type="button" onClick={() => alert("Apple coming soon.")} title="Apple"
                  className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                  <svg className="h-[18px] w-[18px] text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-[10px] text-zinc-400 leading-relaxed">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
