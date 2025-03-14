import { Rocket, Gauge, Wrench, Shield, Zap, Users, Palette, PlugZap, Layout, Upload, Eye, Code, Database, LineChart } from "lucide-react";
import { Feature, Plan, AIService } from "./types";

export const PLANS: Plan[] = [
  {
    id: "quarterly",
    title: "Quarterly Plan",
    price: 40,
    duration: "per 3 months",
    features: [
      "Advanced AI content analysis",
      "Priority content support",
      "Unlimited content optimization",
      "Weekly performance insights"
    ],
    best: true,
    color: "from-blue-600 to-purple-600",
    bgColor: "from-blue-500/10 to-purple-500/10",
  },
  {
    id: "monthly",
    title: "Monthly Plan",
    price: 15,
    duration: "per month",
    features: [
      "Basic AI writing tools",
      "Standard support",
      "10 content optimizations",
      "Monthly content analytics"
    ],
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-500/5 to-blue-600/5",
  },
  {
    id: "yearly",
    title: "Yearly Plan",
    price: 120,
    duration: "per year",
    features: [
      "Unlimited AI enhancements",
      "Dedicated content expert",
      "Premium writing features",
      "Custom content strategies"
    ],
    color: "from-purple-500 to-pink-600",
    bgColor: "from-purple-500/5 to-pink-600/5",
  },
];

export const FEATURES: Feature[] = [
  {
    title: "AI Content Enhancement",
    description: "Transform your content quality with advanced AI algorithms for better readability and engagement.",
    icon: Rocket,
  },
  {
    title: "Smart Content Analysis",
    description: "Get detailed insights and optimization suggestions for your content in real-time.",
    icon: Gauge,
  },
  {
    title: "AI Writing Assistant",
    description: "Generate creative content ideas and outlines with our intelligent writing assistant.",
    icon: Wrench,
  },
];

export const ADDITIONAL_FEATURES: Feature[] = [
  {
    title: "Real-time Analysis",
    description: "Instant feedback on content quality, readability scores, and SEO performance metrics.",
    icon: Shield,
  },
  {
    title: "Smart Formatting",
    description: "Automatic content structuring and formatting for maximum impact and readability.",
    icon: Zap,
  },
  {
    title: "Performance Tracking",
    description: "Comprehensive analytics and AI-powered suggestions to improve content performance.",
    icon: Users,
  },
];

export const AI_SERVICES: AIService[] = [
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
    title: "Plugin Recommendations",
    description: "Get personalized plugin suggestions and automatic installation based on your needs.",
    icon: PlugZap,
    example: "Find the best SEO plugins for my food blog",
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
    description: "Automatically clean and optimize your WordPress database for better performance.",
    icon: Database,
    example: "Optimize my database and remove unused post revisions",
    color: "from-yellow-500 to-amber-600",
  },
  {
    id: "analytics",
    title: "Performance Monitoring",
    description: "Track your site's performance metrics and get AI-powered improvement suggestions.",
    icon: LineChart,
    example: "Analyze my site speed and suggest improvements",
    color: "from-emerald-500 to-green-600",
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechCorp",
    content: "WP.ai has revolutionized how we manage our WordPress sites. The AI assistance is incredibly intuitive and has saved us countless hours.",
    avatar: "/user1.jpg",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Web Developer",
    company: "DigitalCraft",
    content: "The code suggestions and debugging features are spot-on. It's like having a senior developer by your side 24/7.",
    avatar: "/user.png",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Content Creator",
    company: "CreativeMinds",
    content: "As someone who's not too technical, WP.ai has made WordPress development accessible and enjoyable. The natural language interface is a game-changer.",
    avatar: "/user1.jpg",
  },
];

// Animation variants
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8 }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8 }
};

export const staggerContainer = {
  animate: { 
    transition: { 
      staggerChildren: 0.1
    } 
  }
}; 