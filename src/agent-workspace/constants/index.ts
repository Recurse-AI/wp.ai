import { Code, Database, Eye, Layout, Palette, PlugZap, Upload } from "lucide-react";

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
export const AGENT_SERVICES: any[] = [
  {
    id: "plugins",
    title: "Plugin Development",
    description: "Create powerful WordPress plugins with our AI assistant generating code and structure.",
    icon: PlugZap,
    example: "Build a plugin that adds a custom image generation button to the media library",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "themes",
    title: "AI Theme Creation",
    description: "Generate custom WordPress themes based on your brand and preferences using AI.",
    icon: Palette,
    example: "Create a modern e-commerce theme with a blue and white color scheme",
    color: "from-blue-500 to-indigo-600",
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