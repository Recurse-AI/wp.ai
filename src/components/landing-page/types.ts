import { LucideIcon } from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Plan {
  id: string;
  title: string;
  price: number;
  duration: string;
  features: string[];
  best?: boolean;
  color: string;
  bgColor: string;
}

export interface AIService {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  example: string;
  color: string;
}

export interface FeatureCardProps {
  feature: Feature;
  index: number;
}

export interface PricingCardProps {
  plan: Plan;
  onUpgrade: (planId: string) => void;
}

export interface PricingSectionProps {
  onUpgrade: (planId: string) => void;
}

export interface FeedbackSectionProps {
  feedback: string;
  setFeedback: (feedback: string) => void;
  onSubmit: () => void;
}

export interface ChatBotSectionProps {
  onChatOpen: () => void;
}

export interface ServiceCardProps {
  service: AIService;
  index: number;
}

export interface ServicesSectionProps {
  onChatOpen: () => void;
}

export interface TestimonialProps {
  testimonial: {
    id: number;
    name: string;
    role: string;
    company: string;
    content: string;
    avatar: string;
  };
} 