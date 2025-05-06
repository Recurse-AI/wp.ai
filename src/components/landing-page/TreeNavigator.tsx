import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { ArrowRight, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

type NodeType = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  children?: string[]; // IDs of child nodes
  details?: string; // Extended description for expanded view
  link?: {
    url: string;
    label: string;
  };
  category: "core" | "optimization" | "security" | "development"; // Categories for filtering
};

// Updated connection type to include direction
type ConnectionType = {
  start: string;
  end: string;
  direction?: 'up' | 'down';
};

// Updated nodes with relationship structure and detailed information
const nodes: NodeType[] = [
  {
    id: "wordpress-agent",
    title: "WordPress Agent",
    description: "AI-powered assistant for WordPress site management and optimization",
    details: "Our WordPress Agent leverages advanced AI to automate and enhance site management tasks. It continuously monitors your site's health, suggests improvements, and can implement changes automatically.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8"></path>
        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
        <path d="M2 14h2"></path>
        <path d="M20 14h2"></path>
        <path d="M15 13v2"></path>
        <path d="M9 13v2"></path>
      </svg>
    ),
    color: "from-blue-600 to-indigo-600",
    children: ["content-optimization", "seo-analysis", "plugin-development", "theme-development", "page-development"],
    link: {
      url: "/agent-workspace",
      label: "Open Agent Workspace"
    },
    category: "core"
  },
  {
    id: "content-optimization",
    title: "Content Optimization",
    description: "AI-powered tools to enhance your WordPress content quality and engagement",
    details: "Our content optimization tools analyze your existing content for readability, engagement metrics, and SEO performance. It then suggests specific improvements to enhance reader engagement and search engine visibility.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text">
        <path d="M17 6.1H3" />
        <path d="M21 12.1H3" />
        <path d="M15.1 18H3" />
      </svg>
    ),
    color: "from-cyan-500 to-blue-500",
    children: ["performance-testing"],
    link: {
      url: "/content-tools",
      label: "Explore Content Tools"
    },
    category: "optimization"
  },
  {
    id: "seo-analysis",
    title: "SEO Analysis",
    description: "Smart tools to analyze and improve your WordPress site's search engine ranking",
    details: "Our SEO Analysis suite provides comprehensive insights into your site's search engine performance. It identifies keyword opportunities, analyzes competitor strategies, and recommends specific actions to improve your rankings.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    color: "from-purple-500 to-fuchsia-500",
    children: ["security-scanning"],
    link: {
      url: "/seo-tools",
      label: "View SEO Tools"
    },
    category: "optimization"
  },
  {
    id: "plugin-development",
    title: "Plugin Development",
    description: "Create custom WordPress plugins with AI assistance",
    details: "Our Plugin Development environment lets you create custom WordPress plugins with AI assistance. The system can generate code, suggest improvements, and even handle complex integration patterns for you.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-puzzle">
        <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925-.128-.348-.171-.722-.128-1.092.131-1.129-.445-2.261-1.438-2.969-2.17-1.553-6.194 1.358-6.497 5.87-.211 3.146 2.5 5.598 5.442 5.598.432 0 .864-.046 1.284-.138.996-.222 1.576-1.196 1.269-2.167-.142-.454-.067-.934.204-1.289" />
        <path d="M11.93 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
      </svg>
    ),
    color: "from-pink-500 to-rose-500",
    link: {
      url: "/plugin-builder",
      label: "Start Building Plugins"
    },
    category: "development"
  },
  {
    id: "performance-testing",
    title: "Performance Testing",
    description: "Analyze and optimize your WordPress site's performance",
    details: "Our Performance Testing suite examines every aspect of your WordPress site's performance, from server response times to asset loading. It identifies bottlenecks and provides actionable recommendations to improve loading speeds and user experience.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gauge">
        <path d="m12 14 4-4" />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      </svg>
    ),
    color: "from-amber-500 to-orange-500",
    link: {
      url: "/performance-tools",
      label: "Test Performance"
    },
    category: "optimization"
  },
  {
    id: "security-scanning",
    title: "Security Scanning",
    description: "Identify and fix security vulnerabilities in your WordPress installation",
    details: "Our Security Scanning tools continuously monitor your WordPress site for vulnerabilities, malware, and suspicious activities. It provides real-time alerts and can automatically implement security fixes to protect your site from threats.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      </svg>
    ),
    color: "from-emerald-500 to-green-500",
    link: {
      url: "/security-center",
      label: "Scan Security"
    },
    category: "security"
  },
  {
    id: "theme-development",
    title: "Theme Development",
    description: "Design and develop custom WordPress themes with AI assistance",
    details: "Our Theme Development toolkit provides intelligent assistance for building custom WordPress themes. Get AI recommendations for design patterns, responsive layouts, and performance optimization while maintaining WordPress best practices.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8M3 8h18M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1M9 15l3-3 3 3"/>
      </svg>
    ),
    color: "from-violet-500 to-indigo-500",
    link: {
      url: "/theme-builder",
      label: "Build Custom Themes"
    },
    category: "development"
  },
  {
    id: "page-development",
    title: "Page Development",
    description: "Create dynamic, responsive WordPress pages with AI guidance",
    details: "Our Page Development tools enable fast creation of custom WordPress pages with AI-powered layout suggestions. Design beautiful, responsive pages with intelligent component recommendations and automatic optimization for all devices.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    color: "from-blue-500 to-teal-500",
    link: {
      url: "/page-builder",
      label: "Design Pages"
    },
    category: "development"
  }
];

// Tooltip component for node hover information
const Tooltip: React.FC<{
  isVisible: boolean;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}> = ({ isVisible, content, position }) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
          className={`absolute ${positionClasses[position]} z-50 px-3 py-2 text-sm bg-black/80 dark:bg-white/90 text-white dark:text-gray-900 rounded-md shadow-lg max-w-xs pointer-events-none`}
        >
          {content}
          <div className={`absolute ${
            position === 'top' ? 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45' :
            position === 'bottom' ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45' :
            position === 'left' ? 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45' :
            'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
          } w-2 h-2 bg-black/80 dark:bg-white/90`} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Particle effect for connection lines
const ParticleEffect: React.FC<{
  path: string;
  color: string;
  isVisible: boolean;
}> = ({ path, color, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.circle
          r={3}
          fill={color}
          filter="url(#glow)"
          initial={{ offsetDistance: "0%" }}
          animate={{ 
            offsetDistance: "100%",
            transition: { 
              duration: 3, 
              repeat: Infinity,
              ease: "linear" 
            }
          }}
          style={{ 
            offsetPath: `path("${path}")`,
            offsetRotate: "auto"
          }}
        />
      )}
    </AnimatePresence>
  );
};

// Node component with animation and interactivity
const Node: React.FC<{ 
  node: NodeType; 
  index: number; 
  position: 'left' | 'right' | 'center';
  nodeRefs: React.MutableRefObject<{[key: string]: HTMLDivElement | null}>;
  activeFilter: string | null;
  onNodeClick: (nodeId: string) => void;
  expandedNodes: string[];
  highlightedNodes: string[];
}> = ({ 
  node, 
  index, 
  position, 
  nodeRefs, 
  activeFilter, 
  onNodeClick, 
  expandedNodes,
  highlightedNodes
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = expandedNodes.includes(node.id);
  const isHighlighted = highlightedNodes.includes(node.id);
  const isActive = activeFilter ? node.category === activeFilter || activeFilter === 'all' : true;

  const opacity = !isActive ? 0.4 : isHighlighted ? 1 : 0.85;
  
  // Store node reference for position calculations
  useEffect(() => {
    if (ref.current) {
      nodeRefs.current[node.id] = ref.current;
    }
  }, [node.id, nodeRefs]);
  
  // Trigger animations when in view
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  // Scroll node into view if highlighted
  useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [isHighlighted]);
  
  // Define variants for initial animation
  const variants = {
    hidden: { 
      opacity: 0, 
      x: position === 'left' ? -50 : position === 'right' ? 50 : 0,
      y: position === 'center' ? -50 : 0 
    },
    visible: { 
      opacity,
      x: 0,
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: index * 0.2 
      }
    }
  };
  
  // Additional animation for highlights
  const highlightAnimation = {
    scale: isHighlighted ? 1.05 : 1,
    opacity,
    transition: { duration: 0.3 }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      whileHover={{ scale: 1.02 }}
      className={`relative flex flex-col items-center mb-20 md:mb-24 ${
        position === 'left' 
          ? 'md:flex-row md:self-start md:text-left md:items-start' 
          : position === 'right' 
            ? 'md:flex-row-reverse md:self-end md:text-right md:items-start'
            : 'items-center text-center' // center position
      } cursor-pointer transition-all`}
      data-id={node.id}
      onClick={() => onNodeClick(node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: highlightAnimation.opacity,
        scale: highlightAnimation.scale
      }}
    >
      {/* Tooltip on hover */}
      <Tooltip 
        isVisible={isHovered && !isExpanded} 
        content={`Click to ${isExpanded ? 'collapse' : 'expand'} details`}
        position={position === 'left' ? 'right' : position === 'right' ? 'left' : 'top'}
      />
      
      {/* Highlight effect for active nodes */}
      {isHighlighted && (
        <motion.div 
          className="absolute inset-0 rounded-xl -m-2 z-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.15, scale: 1.05 }}
          exit={{ opacity: 0, scale: 1.1 }}
          style={{ background: `radial-gradient(circle, ${node.color.split(' ')[0].replace('from-', '')} 0%, transparent 70%)` }}
        />
      )}
      
      <div 
        className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${node.color} flex items-center justify-center shadow-lg mb-4 md:mb-0 ${
          position !== 'center' ? 'md:mx-6' : ''
        } transition-transform duration-300 ${isHighlighted ? 'scale-110 ring-2 ring-white dark:ring-gray-800 ring-offset-2' : ''}`}
      >
        <div className="text-white">{node.icon}</div>
      </div>
      
      <div className={`relative z-10 ${position !== 'center' ? 'max-w-xs' : 'max-w-sm'}`}>
        <h3 className="text-xl font-bold mb-2">{node.title}</h3>
        <p className="text-muted-foreground text-sm">{node.description}</p>
        
        {/* Expanded details section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <p className="text-sm text-muted-foreground mb-4">{node.details}</p>
              
              {node.link && (
                <a 
                  href={node.link.url}
                  className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  {node.link.label}
                  <ExternalLink size={14} className="ml-1" />
                </a>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(node.id);
                }}
                className="flex items-center justify-center w-6 h-6 mt-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mx-auto"
              >
                <ChevronUp size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Expand button when collapsed */}
        {!isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.id);
            }}
            className="flex items-center justify-center w-6 h-6 mt-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mx-auto"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
      
      {/* Node connector dot - for timeline visualization */}
      <div 
        className={`absolute ${
          position === 'left'
            ? 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 md:hidden'
            : position === 'right'
              ? 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 md:hidden'
              : 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2'
        } w-3 h-3 rounded-full bg-gradient-to-br ${node.color} shadow-lg z-10`} 
      />
    </motion.div>
  );
};

// Timeline marker component that appears during scroll
const TimelineMarker: React.FC<{
  nodeId: string;
  isVisible: boolean;
  position: number;
  delay: number;
  color: string;
}> = ({ nodeId, isVisible, position, delay, color }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? {
        scale: 1,
        opacity: 1,
        transition: { 
          duration: 0.4, 
          delay,
          type: "spring",
          stiffness: 500,
          damping: 30
        }
      } : {
        scale: 0,
        opacity: 0
      }}
      className="absolute left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
      style={{ top: `${position}%` }}
    >
      <div 
        className="w-3 h-3 rounded-full shadow-md"
        style={{ background: `linear-gradient(45deg, ${color}, ${color}AA)` }}
      />
      <div 
        className="absolute top-0 left-0 w-3 h-3 rounded-full animate-ping opacity-75"
        style={{ background: color }}
      />
    </motion.div>
  );
};

// Improved Timeline-to-node connector component
const TimelineNodeConnector: React.FC<{
  nodeId: string;
  nodePositions: {[key: string]: DOMRect | null};
  position: 'left' | 'right' | 'center';
  isVisible: boolean;
  color: string;
  index: number;
}> = ({ nodeId, nodePositions, position, isVisible, color, index }) => {
  const nodePosition = nodePositions[nodeId];
  const [timelineX, setTimelineX] = useState(0);
  
  useEffect(() => {
    setTimelineX(window.innerWidth / 2);
  }, []);
  
  if (!nodePosition || !timelineX) {
    return null;
  }
  
  // Calculate connector path points with improved positioning
  const nodeX = nodePosition.left + nodePosition.width / 2;
  const nodeY = nodePosition.top + nodePosition.height / 2;
  
  // Adjust connector paths based on position with better spacing
  const path = position === 'center' 
    ? `M${timelineX},${nodeY - 40} L${nodeX},${nodeY - 40}` // Top connection for center
    : position === 'left'
    ? `M${timelineX},${nodeY} L${nodeX + 40},${nodeY}` // Left-side connection with more space
    : `M${timelineX},${nodeY} L${nodeX - 40},${nodeY}`; // Right-side connection with more space
  
  return (
    <motion.path
      d={path}
      stroke={`url(#gradient-${nodeId})`}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={isVisible ? {
        pathLength: 1, 
        opacity: 1,
        transition: { 
          duration: 0.8, 
          delay: 0.3 + (index * 0.1),
          ease: "easeOut"
        }
      } : {
        pathLength: 0,
        opacity: 0
      }}
    />
  );
};

// ZigzagConnection component for drawing paths between nodes
const ZigzagConnection: React.FC<{
  startNode: string;
  endNode: string;
  nodePositions: {[key: string]: DOMRect | null};
  index: number;
  isVisible: boolean;
  highlightedConnection: boolean;
  onConnectionHover: (start: string, end: string, isHovering: boolean) => void;
  direction?: 'up' | 'down';
}> = ({ 
  startNode, 
  endNode, 
  nodePositions, 
  index, 
  isVisible, 
  highlightedConnection,
  onConnectionHover,
  direction = 'down'
}) => {
  // Default fallback positions
  const startPosition = nodePositions[startNode];
  const endPosition = nodePositions[endNode];
  
  if (!startPosition || !endPosition) {
    return null;
  }
  
  // Calculate start and end points with improved positioning
  const startX = startPosition.left + startPosition.width / 2;
  const startY = startPosition.top + startPosition.height / 2;
  const endX = endPosition.left + endPosition.width / 2;
  const endY = direction === 'down' ? endPosition.top : endPosition.bottom;
  
  // Calculate zigzag control points with better spacing
  const midY = startY + (endY - startY) / 2;
  const offset = Math.min(100, Math.abs(endX - startX) * 0.4) * (index % 2 === 0 ? 1 : -1);
  
  // Create a smoother zigzag path with multiple control points
  const path = direction === 'down' 
    ? `
      M${startX},${startY} 
      C${startX},${startY + 50} ${startX + offset},${midY - 50} ${startX + offset},${midY}
      S${endX - offset},${midY + 50} ${endX - offset},${midY + 100}
      S${endX},${endY - 50} ${endX},${endY}
    `
    : `
      M${startX},${startY} 
      C${startX},${startY - 50} ${startX + offset},${midY + 50} ${startX + offset},${midY}
      S${endX - offset},${midY - 50} ${endX - offset},${midY - 100}
      S${endX},${endY + 50} ${endX},${endY}
    `;
  
  // Colors for the nodes to extract gradient colors
  const startNodeData = nodes.find(n => n.id === startNode);
  const gradientColor = startNodeData?.color.split(' ')[0].replace('from-', '') || '#8B5CF6';
  
  // Determine animation properties based on visibility and highlight state
  const pathAnimation = isVisible 
    ? {
        pathLength: 1, 
        opacity: highlightedConnection ? 1 : 0.7,
        transition: { 
          duration: 1.2, 
          delay: index * 0.2,
          ease: "easeInOut"
        }
      } 
    : {
        pathLength: 0,
        opacity: 0
      };
  
  return (
    <>
      <motion.path
        d={path}
        stroke={highlightedConnection ? "url(#highlightGradient)" : "url(#gradient)"}
        strokeWidth={highlightedConnection ? "3" : "2"}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="8 4"
        filter={highlightedConnection ? "url(#glow)" : undefined}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={pathAnimation}
        onMouseEnter={() => onConnectionHover(startNode, endNode, true)}
        onMouseLeave={() => onConnectionHover(startNode, endNode, false)}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Animated particles along the path */}
      {isVisible && (
        <>
          <ParticleEffect path={path} color={gradientColor} isVisible={highlightedConnection} />
          {highlightedConnection && (
            <>
              <ParticleEffect 
                path={path} 
                color={gradientColor} 
                isVisible={highlightedConnection} 
              />
              <ParticleEffect 
                path={path} 
                color={gradientColor} 
                isVisible={highlightedConnection} 
              />
            </>
          )}
        </>
      )}
    </>
  );
};

// Animated pulse effect on connection lines
const ConnectionNode: React.FC<{
  x: number;
  y: number;
  delay: number;
  isVisible: boolean;
  color: string;
  isHighlighted: boolean;
}> = ({ x, y, delay, isVisible, color, isHighlighted }) => {
  const size = isHighlighted ? 6 : 4;
  
  return (
    <motion.circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      filter={isHighlighted ? "url(#glow)" : undefined}
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? {
        scale: [0, 1.5, 0],
        opacity: [0, isHighlighted ? 1 : 0.8, 0],
        transition: {
          duration: isHighlighted ? 1.5 : 2,
          delay,
          repeat: Infinity,
          repeatDelay: isHighlighted ? 0.3 : 0.5
        }
      } : {
        scale: 0,
        opacity: 0
      }}
    />
  );
};

// Category filter button
const FilterButton: React.FC<{
  category: string;
  label: string;
  activeFilter: string | null;
  onClick: (category: string) => void;
  color: string;
}> = ({ category, label, activeFilter, onClick, color }) => {
  const isActive = activeFilter === category;
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(category)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
        isActive 
          ? `bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200 shadow-md` 
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </motion.button>
  );
};

// Network background pattern component
const NetworkPattern: React.FC<{
  isVisible: boolean;
}> = ({ isVisible }) => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 0.7 : 0 }}
      transition={{ duration: 1 }}
    >
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern id="networkGrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" />
          </pattern>
          <radialGradient id="networkFade" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="networkMask">
            <rect width="100%" height="100%" fill="url(#networkFade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#networkGrid)" mask="url(#networkMask)" />
      </svg>
    </motion.div>
  );
};

// Structure the nodes into a timeline format
type TimelineNodeType = NodeType & { position: 'left' | 'right' | 'center' };

const timelineNodes: TimelineNodeType[] = [
  { ...nodes[0], position: 'center' as const }, // WordPress Agent
  { ...nodes[1], position: 'left' as const },   // Content Optimization
  { ...nodes[2], position: 'right' as const },  // SEO Analysis
  { ...nodes[3], position: 'left' as const },   // Plugin Development
  { ...nodes.find(node => node.id === "theme-development") || nodes[0], position: 'right' as const }, // Theme Development
  { ...nodes[4], position: 'left' as const },   // Performance Testing
  { ...nodes[5], position: 'right' as const },  // Security Scanning
  { ...nodes.find(node => node.id === "page-development") || nodes[0], position: 'left' as const },  // Page Development
];

// Client-side only wrapper component
const ClientOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
};

const TreeNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });
  const [nodePositions, setNodePositions] = useState<{[key: string]: DOMRect | null}>({});
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [highlightedConnections, setHighlightedConnections] = useState<{start: string, end: string}[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // Define connections between nodes
  const connections: ConnectionType[] = [
    { start: "wordpress-agent", end: "content-optimization" },
    { start: "wordpress-agent", end: "seo-analysis" },
    { start: "wordpress-agent", end: "plugin-development" },
    { start: "wordpress-agent", end: "theme-development" },
    { start: "wordpress-agent", end: "page-development" },
    { start: "content-optimization", end: "performance-testing" },
    { start: "seo-analysis", end: "security-scanning" },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate node positions whenever viewport changes or nodes mount
  useEffect(() => {
    if (isInView && isMounted) {
      const calculatePositions = () => {
        const positions: {[key: string]: DOMRect | null} = {};
        
        // For each node ref, get its position
        Object.keys(nodeRefs.current).forEach(nodeId => {
          const el = nodeRefs.current[nodeId];
          if (el) {
            const rect = el.getBoundingClientRect();
            const scrollY = window.scrollY;
            
            // Adjust for scroll position to get absolute positions
            positions[nodeId] = new DOMRect(
              rect.left,
              rect.top + scrollY,
              rect.width,
              rect.height
            );
          }
        });
        
        setNodePositions(positions);
      };
      
      // Calculate initial positions
      setTimeout(calculatePositions, 500);
      
      // Recalculate on resize and scroll
      window.addEventListener('resize', calculatePositions);
      window.addEventListener('scroll', calculatePositions);
      
      return () => {
        window.removeEventListener('resize', calculatePositions);
        window.removeEventListener('scroll', calculatePositions);
      };
    }
  }, [isInView, expandedNodes, isMounted]);

  // Handle node click for expanding/collapsing details
  const handleNodeClick = useCallback((nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId) 
        : [...prev, nodeId]
    );
  }, []);
  
  // Handle connection hover to highlight connected nodes
  const handleConnectionHover = useCallback((start: string, end: string, isHovering: boolean) => {
    if (isHovering) {
      setHighlightedNodes([start, end]);
      setHighlightedConnections([{start, end}]);
    } else {
      setHighlightedNodes([]);
      setHighlightedConnections([]);
    }
  }, []);
  
  // Handle category filter
  const handleFilterChange = useCallback((category: string) => {
    setActiveFilter(prev => prev === category ? null : category);
    
    // Auto-expand nodes of the selected category
    if (category !== 'all' && category !== null) {
      const categoryNodes = nodes
        .filter(node => node.category === category)
        .map(node => node.id);
      
      setExpandedNodes(categoryNodes);
    } else if (category === 'all') {
      // When "All" is selected, collapse all nodes
      setExpandedNodes([]);
    }
  }, []);
  
  // Add scroll progress tracking
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how much of the container is visible
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const containerHeight = rect.height;
        
        // Calculate scroll progress (0 to 1)
        let progress = 0;
        if (rect.top <= 0) {
          progress = Math.min(Math.abs(rect.top) / (containerHeight - windowHeight), 1);
        }
        
        setScrollProgress(progress);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initialize
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMounted]);
  
  // Define additional upward connections for the zigzag pattern
  const upwardConnections: ConnectionType[] = [
    { start: "wordpress-agent", end: "plugin-development", direction: "up" as const },
    { start: "wordpress-agent", end: "theme-development", direction: "up" as const },
    { start: "content-optimization", end: "wordpress-agent", direction: "up" as const },
    { start: "page-development", end: "theme-development", direction: "up" as const },
  ];
  
  // All connections combining existing and upward
  const allConnections = [
    ...connections,
    ...upwardConnections
  ];
  
  return (
    <section className="py-20 md:py-32 w-full relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-950">
      <Container>
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              WordPress Enhancement Architecture
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Our integrated toolset connects AI-powered components to enhance every aspect of your WordPress site
          </motion.p>
          
          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <FilterButton 
              category="all" 
              label="All Tools" 
              activeFilter={activeFilter} 
              onClick={handleFilterChange}
              color="gray"
            />
            <FilterButton 
              category="core" 
              label="Core System" 
              activeFilter={activeFilter} 
              onClick={handleFilterChange}
              color="blue"
            />
            <FilterButton 
              category="optimization" 
              label="Optimization" 
              activeFilter={activeFilter} 
              onClick={handleFilterChange}
              color="purple"
            />
            <FilterButton 
              category="security" 
              label="Security" 
              activeFilter={activeFilter} 
              onClick={handleFilterChange}
              color="green"
            />
            <FilterButton 
              category="development" 
              label="Development" 
              activeFilter={activeFilter} 
              onClick={handleFilterChange}
              color="pink"
            />
          </div>
          
          {/* Instruction text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            className="text-sm text-muted-foreground"
          >
            Click on nodes to expand details or hover over connections to see relationships
          </motion.p>
        </div>
        
        <div 
          ref={containerRef}
          className="relative min-h-[600px]"
        >
          {/* Network background pattern */}
          <NetworkPattern isVisible={isInView} />
          
          {/* Timeline central line with animated markers */}
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={isInView ? { height: '100%', opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-50 z-0 top-0 bottom-0"
          />
          
          {/* Client-side only content */}
          <ClientOnly>
            {/* Timeline markers that appear during scroll */}
            {nodes.map((node, index) => (
              <TimelineMarker
                key={`marker-${node.id}`}
                nodeId={node.id}
                isVisible={isInView && scrollProgress > index * 0.15}
                position={(index + 1) * 15}
                delay={index * 0.2}
                color={node.color.split(' ')[0].replace('from-', '')}
              />
            ))}
            
            {/* Staggered Nodes Layout */}
            <div className="flex flex-col relative z-10 max-w-5xl mx-auto">
              {timelineNodes.map((node, index) => (
                <Node 
                  key={node.id} 
                  node={node} 
                  index={index} 
                  position={node.position as 'left' | 'right' | 'center'} 
                  nodeRefs={nodeRefs}
                  activeFilter={activeFilter}
                  onNodeClick={handleNodeClick}
                  expandedNodes={expandedNodes}
                  highlightedNodes={highlightedNodes}
                />
              ))}
            </div>
            
            {/* SVG for connection lines */}
            <svg 
              ref={svgRef}
              className="absolute top-0 left-0 w-full h-full z-1 pointer-events-none"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                
                <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="50%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
                
                {/* Node-specific gradients for connectors */}
                {nodes.map(node => (
                  <linearGradient key={`gradient-${node.id}`} id={`gradient-${node.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={node.color.split(' ')[0].replace('from-', '')} />
                    <stop offset="100%" stopColor={node.color.split(' ')[1].replace('to-', '')} />
                  </linearGradient>
                ))}
                
                {/* Glow effect for highlighted elements */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Timeline to node connectors */}
              {timelineNodes.map((node, index) => (
                <TimelineNodeConnector
                  key={`timeline-connector-${node.id}`}
                  nodeId={node.id}
                  nodePositions={nodePositions}
                  position={node.position as 'left' | 'right' | 'center'}
                  isVisible={isInView && scrollProgress > index * 0.15}
                  color={node.color}
                  index={index}
                />
              ))}
              
              {/* Connection lines with zigzag paths - now including upward connections */}
              {allConnections.map((connection, index) => (
                <ZigzagConnection
                  key={`${connection.start}-${connection.end}-${connection.direction || 'down'}`}
                  startNode={connection.start}
                  endNode={connection.end}
                  nodePositions={nodePositions}
                  index={index}
                  isVisible={isInView}
                  highlightedConnection={highlightedConnections.some(
                    conn => conn.start === connection.start && conn.end === connection.end
                  )}
                  onConnectionHover={handleConnectionHover}
                  direction={connection.direction as 'up' | 'down' | undefined}
                />
              ))}
              
              {/* Connection nodes - animated dots along the connection paths */}
              {Object.entries(nodePositions).map(([nodeId, position], i) => (
                position && (
                  <ConnectionNode
                    key={`node-${nodeId}`}
                    x={position.left + position.width / 2}
                    y={position.top + position.height / 2}
                    delay={i * 0.4}
                    isVisible={isInView}
                    color={nodes.find(n => n.id === nodeId)?.color.split(' ')[0].replace('from-', '') || '#8B5CF6'}
                    isHighlighted={highlightedNodes.includes(nodeId)}
                  />
                )
              ))}
            </svg>
          </ClientOnly>
        </div>
      </Container>
      
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-70 pointer-events-none">
        <div className="network-grid"></div>
      </div>

      <style jsx>{`
        .network-grid {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(99, 102, 241, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.12) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 70%);
        }
      `}</style>
    </section>
  );
};

export default TreeNavigator; 