import { Rocket, Gauge, Wrench, Shield, Zap, Users, Palette, PlugZap, Layout, Upload, Eye, Code, Database, LineChart } from "lucide-react";
import { Feature, Plan, AIService } from "./types";

export const PLANS: Plan[] = [
  {
    id: "quarterly",
    title: "Quarterly Plan",
    price: 40,
    duration: "per 3 months",
    features: ["Advanced AI suggestions", "Priority support", "Exclusive WP plugins", "Weekly performance reports"],
    best: true,
    color: "from-blue-600 to-purple-600",
    bgColor: "from-blue-500/10 to-purple-500/10",
  },
  {
    id: "monthly",
    title: "Monthly Plan",
    price: 15,
    duration: "per month",
    features: ["Core AI features", "Basic support", "10 WP optimizations", "Monthly insights"],
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-500/5 to-blue-600/5",
  },
  {
    id: "yearly",
    title: "Yearly Plan",
    price: 120,
    duration: "per year",
    features: ["Unlimited AI optimizations", "Dedicated WP consultant", "Exclusive plugins", "Custom integrations"],
    color: "from-purple-500 to-pink-600",
    bgColor: "from-purple-500/5 to-pink-600/5",
  },
];

export const FEATURES: Feature[] = [
  {
    title: "AI-Powered SEO",
    description: "Automatically optimizes your content and metadata for better Google rankings.",
    icon: Rocket,
  },
  {
    title: "Faster Load Times",
    description: "Reduce WordPress page load times with intelligent caching and asset optimization.",
    icon: Gauge,
  },
  {
    title: "Auto Optimization",
    description: "Detects issues and fixes them instantly to keep your site running at peak performance.",
    icon: Wrench,
  },
];

export const ADDITIONAL_FEATURES: Feature[] = [
  {
    title: "Advanced Security",
    description: "AI-powered threat detection and prevention to keep your WordPress site secure.",
    icon: Shield,
  },
  {
    title: "Performance Boost",
    description: "Smart optimization techniques that make your site lightning fast.",
    icon: Zap,
  },
  {
    title: "User Analytics",
    description: "Deep insights into visitor behavior to help you optimize user experience.",
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
    company: "TechGrowth",
    content: "WP.ai transformed our WordPress site completely. The AI suggestions alone increased our organic traffic by 45% in just two months!",
    avatar: "/avatars/sarah.jpg",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "E-commerce Owner",
    company: "StyleBoutique",
    content: "My online store's performance improved dramatically with WP.ai. Page load times reduced by 70% and conversion rates are up by 25%.",
    avatar: "/avatars/michael.jpg",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Content Creator",
    company: "Creative Minds",
    content: "The SEO optimization feature is a game-changer. My content now ranks higher without any manual tweaking. Absolutely worth every penny!",
    avatar: "/avatars/emily.jpg",
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