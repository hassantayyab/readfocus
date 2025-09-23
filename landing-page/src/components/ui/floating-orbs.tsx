"use client";
import { motion } from "framer-motion";

export const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large orb top right */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"
      />

      {/* Medium orb center left */}
      <motion.div
        animate={{
          y: [0, 40, 0],
          x: [0, -15, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
        className="absolute top-1/2 left-10 w-48 h-48 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-2xl"
      />

      {/* Small orb bottom center */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 4,
        }}
        className="absolute bottom-32 left-1/2 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-xl"
      />

      {/* Accent orb top left */}
      <motion.div
        animate={{
          y: [0, 25, 0],
          x: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
        className="absolute top-40 left-40 w-24 h-24 bg-gradient-to-br from-indigo-500/25 to-blue-600/25 rounded-full blur-lg"
      />
    </div>
  );
};