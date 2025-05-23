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
      url: "/",
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

// Simplified Node component
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
  
  useEffect(() => {
    if (ref.current) {
      nodeRefs.current[node.id] = ref.current;
    }
  }, [node.id, nodeRefs]);
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

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
        delay: index * 0.1 
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      whileHover={{ scale: 1.02 }}
      className={`relative flex flex-col items-center mb-16 md:mb-20 ${
        position === 'left' 
          ? 'md:flex-row md:self-start md:text-left md:items-start' 
          : position === 'right' 
            ? 'md:flex-row-reverse md:self-end md:text-right md:items-start'
            : 'items-center text-center'
      } cursor-pointer transition-all`}
      data-id={node.id}
      onClick={() => onNodeClick(node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: opacity,
        scale: isHighlighted ? 1.05 : 1
      }}
    >
      <div 
        className={`relative z-10 w-14 h-14 rounded-full bg-gradient-to-br ${node.color} flex items-center justify-center shadow-md mb-4 md:mb-0 ${
          position !== 'center' ? 'md:mx-4' : ''
        }`}
      >
        <div className="text-white">{node.icon}</div>
      </div>
      
      <div className={`relative z-10 ${position !== 'center' ? 'max-w-xs' : 'max-w-sm'}`}>
        <h3 className="text-xl font-bold mb-2">{node.title}</h3>
        <p className="text-muted-foreground text-sm">{node.description}</p>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mt-4"
            >
              <p className="text-sm text-muted-foreground mb-4">{node.details}</p>
              
              {node.link && (
                <a 
                  href={node.link.url}
                  className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
                className="flex items-center justify-center w-6 h-6 mt-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 mx-auto"
              >
                <ChevronUp size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isExpanded && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.id);
            }}
            className="flex items-center justify-center w-6 h-6 mt-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 mx-auto"
          >
            <ChevronDown size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Simplified connection component
const Connection: React.FC<{
  startNode: string;
  endNode: string;
  nodePositions: {[key: string]: DOMRect | null};
  isVisible: boolean;
  highlightedConnection: boolean;
  onConnectionHover: (start: string, end: string, isHovering: boolean) => void;
  direction?: 'up' | 'down';
}> = ({ 
  startNode, 
  endNode, 
  nodePositions, 
  isVisible, 
  highlightedConnection,
  onConnectionHover,
  direction = 'down'
}) => {
  const startPosition = nodePositions[startNode];
  const endPosition = nodePositions[endNode];
  
  if (!startPosition || !endPosition) return null;
  
  const startX = startPosition.left + startPosition.width / 2;
  const startY = startPosition.top + startPosition.height / 2;
  const endX = endPosition.left + endPosition.width / 2;
  const endY = direction === 'down' ? endPosition.top : endPosition.bottom;
  
  const path = `M${startX},${startY} C${startX},${(startY + endY) / 2} ${endX},${(startY + endY) / 2} ${endX},${endY}`;
  
  return (
    <motion.path
      d={path}
      stroke={highlightedConnection ? "#60A5FA" : "#8B5CF6"}
      strokeWidth={highlightedConnection ? "2.5" : "1.5"}
      strokeOpacity={highlightedConnection ? 1 : 0.6}
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ 
        pathLength: isVisible ? 1 : 0, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.8 }}
      onMouseEnter={() => onConnectionHover(startNode, endNode, true)}
      onMouseLeave={() => onConnectionHover(startNode, endNode, false)}
      style={{ cursor: 'pointer' }}
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
        Object.keys(nodeRefs.current).forEach(nodeId => {
          const el = nodeRefs.current[nodeId];
          if (el) {
            const rect = el.getBoundingClientRect();
            const scrollY = window.scrollY;
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
      setTimeout(calculatePositions, 300);
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
    if (category !== 'all' && category !== null) {
      const categoryNodes = nodes
        .filter(node => node.category === category)
        .map(node => node.id);
      setExpandedNodes(categoryNodes);
    } else if (category === 'all') {
      setExpandedNodes([]);
    }
  }, []);

  return (
    <section className="relative py-20 md:py-32 w-full overflow-hidden">
      {/* Decorative background elements for consistency with other sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/5 dark:to-blue-950/10 -z-10"></div>
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -z-10"></div>
      <div className="absolute bottom-0 right-0 -mb-16 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>
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
          {/* Timeline central line */}
          <motion.div 
            initial={{ height: 0 }}
            animate={isInView ? { height: '100%' } : { height: 0 }}
            className="absolute left-1/2 transform -translate-x-1/2 w-px bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"
          />
          {/* Nodes layout */}
          <div className="flex flex-col relative z-10 max-w-5xl mx-auto">
            {timelineNodes.map((node, index) => (
              <Node 
                key={node.id} 
                node={node} 
                index={index} 
                position={node.position} 
                nodeRefs={nodeRefs}
                activeFilter={activeFilter}
                onNodeClick={handleNodeClick}
                expandedNodes={expandedNodes}
                highlightedNodes={highlightedNodes}
              />
            ))}
          </div>
          {/* Connections SVG */}
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            {connections.map((connection, index) => (
              <Connection
                key={`${connection.start}-${connection.end}`}
                startNode={connection.start}
                endNode={connection.end}
                nodePositions={nodePositions}
                isVisible={isInView}
                highlightedConnection={highlightedConnections.some(
                  conn => conn.start === connection.start && conn.end === connection.end
                )}
                onConnectionHover={handleConnectionHover}
                direction={connection.direction}
              />
            ))}
          </svg>
        </div>
      </Container>
      <style jsx>{`
        /* No custom grid pattern needed, background handled by decorative elements above */
      `}</style>
    </section>
  );
};

export default TreeNavigator; 