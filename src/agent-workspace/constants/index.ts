import { Code, Database, Eye, Layout, Palette, PlugZap, Upload } from "lucide-react";
import { AIService, PanelLayout, FileNode } from "../types";

// WordPress Plugin Templates
export const PLUGIN_TEMPLATES = {
  BLANK: "blank",
  BASIC: "basic",
  SETTINGS_PAGE: "settings_page",
  SHORTCODE: "shortcode",
  CUSTOM_POST_TYPE: "custom_post_type",
  DASHBOARD_WIDGET: "dashboard_widget",
};

// WordPress Theme Templates
export const THEME_TEMPLATES = {
  BLANK: "blank",
  BASIC: "basic",
  ECOMMERCE: "ecommerce",
  BLOG: "blog",
  PORTFOLIO: "portfolio",
};

// Default Agent Services
export const AGENT_SERVICES: AIService[] = [
  {
    id: "themes",
    title: "AI Theme Creation",
    description: "Generate custom WordPress themes based on your brand and preferences using AI.",
    icon: Palette,
    example: "Create a modern e-commerce theme with a blue and white color scheme",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "plugins",
    title: "Plugin Development",
    description: "Create powerful WordPress plugins with our AI assistant generating code and structure.",
    icon: PlugZap,
    example: "Build a plugin that adds a custom image generation button to the media library",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "pages",
    title: "Page Builder",
    description: "Design professional pages with our AI assistant generating layouts and content.",
    icon: Layout,
    example: "Create a landing page for my fitness coaching service",
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "deploy",
    title: "One-Click Deployment",
    description: "Deploy your WordPress site to any hosting provider with a single command.",
    icon: Upload,
    example: "Deploy my website to AWS with optimized settings",
    color: "from-orange-500 to-amber-600",
  },
  {
    id: "preview",
    title: "Live Previews",
    description: "Instantly see how your changes will look before committing them to your live site.",
    icon: Eye,
    example: "Show me how this new header would look on mobile devices",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "code",
    title: "Custom Code Generation",
    description: "Generate custom WordPress PHP, CSS, and JavaScript code to extend functionality.",
    icon: Code,
    example: "Write a custom shortcode for displaying team members",
    color: "from-cyan-500 to-teal-600",
  },
  {
    id: "database",
    title: "Database Optimization",
    description: "Create and optimize your WordPress database schema for better performance.",
    icon: Database,
    example: "Create a custom database table for storing user submissions",
    color: "from-yellow-500 to-amber-600",
  },
];

// Default Panel Layouts
export const DEFAULT_PANEL_LAYOUT = PanelLayout.Split;

// Default Plugin Structure
export const DEFAULT_PLUGIN_STRUCTURE: Record<string, FileNode> = {
  "my-plugin": {
    type: "folder" as const,
    children: {
      "my-plugin.php": {
        type: "file" as const,
        content: `<?php
/*
Plugin Name: My Plugin
Description: A custom WordPress plugin created with WP.ai
Version: 1.0
Author: WordPress AI Assistant
*/

// Prevent direct access to this file
if (!defined('ABSPATH')) {
    exit;
}

// Plugin initialization
function my_plugin_init() {
    // Your plugin initialization code here
}

add_action('init', 'my_plugin_init');
`,
        language: "php",
      },
      "readme.txt": {
        type: "file" as const,
        content: `=== My Plugin ===
Contributors: wp.ai
Tags: wordpress, plugin
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0
License: GPLv2 or later

A custom WordPress plugin created with WordPress AI Assistant.

== Description ==
This plugin was created using the WordPress AI Assistant. Add your plugin description here.

== Installation ==
1. Upload the plugin files to the \`/wp-content/plugins/my-plugin\` directory.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Use the plugin features as configured.

== Frequently Asked Questions ==
= How do I customize this plugin? =
You can modify the source code according to your requirements.

== Changelog ==
= 1.0 =
* Initial release
`,
        language: "text",
      },
      "assets": {
        type: "folder" as const,
        children: {
          "css": {
            type: "folder" as const,
            children: {
              "style.css": {
                type: "file" as const,
                content: `/* Main plugin styles */
.my-plugin-container {
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 4px;
    margin-bottom: 20px;
}

.my-plugin-heading {
    font-size: 24px;
    margin-bottom: 15px;
    color: #23282d;
}
`,
                language: "css",
              },
            },
          },
          "js": {
            type: "folder" as const,
            children: {
              "script.js": {
                type: "file" as const,
                content: `/**
 * Main plugin JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Plugin initialization code
    console.log('My Plugin initialized');
});
`,
                language: "javascript",
              },
            },
          },
        },
      },
    },
  },
}; 