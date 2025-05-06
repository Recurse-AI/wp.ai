"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, PhoneCall, MapPin, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";

const Footer = ({ excludedPaths }: { excludedPaths: string[] }) => {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isExcludedPath = excludedPaths.includes(pathname) || pathname?.startsWith('/agent-workspace/') || pathname?.startsWith('/chat/');

  if (isExcludedPath) {
    return null;
  }

  return (
    <footer className="relative border-t border-gray-200 dark:border-gray-800 mt-20">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-indigo-50/30 dark:from-transparent dark:via-blue-950/10 dark:to-indigo-950/10" />

      {/* Main footer content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Information */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="flex items-center">
                <span className="text-xl font-serif font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  WordPress Agent
                </span>
              </Link>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">
                Your AI-powered WordPress assistant to streamline your website management and content creation.
              </p>
              <div className="flex space-x-4 mt-6">
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Facebook size={18} />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Twitter size={18} />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Instagram size={18} />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Linkedin size={18} />
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Github size={18} />
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: "Home", href: "/" },
                { name: "About", href: "/about" },
                { name: "Services", href: "/services" },
                { name: "Blog", href: "/blog" },
                { name: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.name}>
                  <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Link 
                      href={item.href}
                      className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors text-sm flex items-center"
                    >
                      <ArrowUpRight size={14} className="mr-2" />
                      {item.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Our Services
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { name: "WordPress Management", href: "/services#management" },
                { name: "Content Generation", href: "/services#content" },
                { name: "SEO Optimization", href: "/services#seo" },
                { name: "Plugin Configuration", href: "/services#plugins" },
                { name: "Theme Customization", href: "/services#themes" },
              ].map((item) => (
                <li key={item.name}>
                  <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Link 
                      href={item.href}
                      className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors text-sm flex items-center"
                    >
                      <ArrowUpRight size={14} className="mr-2" />
                      {item.name}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start">
                <MapPin size={18} className="mt-0.5 mr-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  1234 WordPress Lane<br />
                  San Francisco, CA 94107
                </span>
              </li>
              <li className="flex items-center">
                <PhoneCall size={18} className="mr-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  +1 (555) 123-4567
                </span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  support@wordpress-agent.com
                </span>
              </li>
            </ul>
            <div className="mt-6">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-2.5 px-5 rounded-md shadow-sm"
              >
                Contact Us
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Newsletter subscription */}
        <motion.div 
          className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 text-center">
              Subscribe to our newsletter
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center max-w-xl mx-auto">
              Get the latest WordPress tips, tricks, and AI automation strategies delivered directly to your inbox.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-2.5 px-5 rounded-md shadow-sm whitespace-nowrap"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar with copyright and legal links */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} WordPress Agent. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
