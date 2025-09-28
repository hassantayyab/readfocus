"use client";
import { motion } from "framer-motion";
import Button from "@/components/ui/button";

const Header = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50"
      className="bg-orange-50/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Kuiqlee</span>
          </motion.div>

          <nav className="hidden md:flex items-center space-x-8">
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="#features"
              className="transition-colors font-medium text-gray-900"
            >
              Features
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="#how-it-works"
              className="transition-colors font-medium text-gray-900"
            >
              How it Works
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="#pricing"
              className="transition-colors font-medium text-gray-900"
            >
              Pricing
            </motion.a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="primary" size="md">
              Add to Chrome
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;