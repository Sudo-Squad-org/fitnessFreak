import React from "react";
import { motion } from "framer-motion";

export const AuthCard = ({ title, subtitle, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl border bg-white shadow-sm dark:bg-zinc-900/80 dark:border-zinc-800"
    >
      <div className="p-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  );
};
