import React from "react";
import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";

export const AuthLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <div className="flex flex-1">
      {/* Left panel — always dark branding */}
      <div className="hidden w-1/2 flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/20" />

        {/* Top logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <div className="h-4 w-4 rounded-full bg-zinc-900" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">FitnessFreak</span>
        </motion.div>

        {/* Bottom quote */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10"
        >
          <blockquote className="text-3xl font-bold tracking-tight text-white leading-tight mb-4">
            "Push harder than yesterday if you want a different tomorrow."
          </blockquote>
          <p className="text-zinc-400 text-sm">
            Join thousands of members leveling up their fitness every day.
          </p>
          <div className="mt-8 flex items-center gap-6 text-sm text-zinc-400">
            <div><span className="text-white font-bold text-lg">12+</span><br />Class types</div>
            <div className="h-8 w-px bg-zinc-700" />
            <div><span className="text-white font-bold text-lg">50+</span><br />Expert trainers</div>
            <div className="h-8 w-px bg-zinc-700" />
            <div><span className="text-white font-bold text-lg">10k+</span><br />Members</div>
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
};
