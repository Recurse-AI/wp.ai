"use client";

import React, { useState } from 'react';
import { useAgentState } from '../../hooks/useAgentState';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/Spinner';

interface WordPressToolboxProps {
  workspaceId: string;
}

export default function WordPressToolbox({ workspaceId }: WordPressToolboxProps) {
  const { sessionState } = useAgentState({ workspaceId });
  
  const [activeTab, setActiveTab] = useState<string>('plugin');
  
  // Plugin state
  const [pluginPrompt, setPluginPrompt] = useState<string>('');
  const [pluginSlug, setPluginSlug] = useState<string>('');
  const [pluginName, setPluginName] = useState<string>('');
  const [pluginDescription, setPluginDescription] = useState<string>('');
  
  // Theme state
  const [themePrompt, setThemePrompt] = useState<string>('');
  const [themeSlug, setThemeSlug] = useState<string>('');
  const [themeName, setThemeName] = useState<string>('');
  const [themeDescription, setThemeDescription] = useState<string>('');
  
  const handleCreatePlugin = async () => {
    if (!pluginPrompt || !pluginSlug) {
      toast.error('Please provide both a prompt and a slug for your plugin');
      return;
    }
    
    try {
     
      // Clear form on success
      setPluginPrompt('');
      setPluginSlug('');
      setPluginName('');
      setPluginDescription('');
      
    } catch (error) {
      console.error('Error creating plugin:', error);
    }
  };
  
  const handleCreateTheme = async () => {
    if (!themePrompt || !themeSlug) {
      toast.error('Please provide both a prompt and a slug for your theme');
      return;
    }
    
    try {
      
      // Clear form on success
      setThemePrompt('');
      setThemeSlug('');
      setThemeName('');
      setThemeDescription('');
      
    } catch (error) {
      console.error('Error creating theme:', error);
    }
  };
  
  const handleGenerateSlug = (type: 'plugin' | 'theme') => {
    // Generate slug from name
    if (type === 'plugin' && pluginName) {
      const slug = pluginName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setPluginSlug(slug);
    } else if (type === 'theme' && themeName) {
      const slug = themeName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setThemeSlug(slug);
    }
  };
  
  return (
    <div className="p-4 bg-card rounded-lg border">
      <h2 className="text-xl font-bold mb-4">WordPress Toolbox</h2>
      
      <Tabs defaultValue="plugin" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="plugin">Create Plugin</TabsTrigger>
          <TabsTrigger value="theme">Create Theme</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plugin">
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">What plugin do you want to create?</label>
              <Textarea
                placeholder="Describe the WordPress plugin you want to create in detail..."
                value={pluginPrompt}
                onChange={(e) => setPluginPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Plugin Name</label>
                <Input
                  placeholder="My Awesome Plugin"
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                  onBlur={() => handleGenerateSlug('plugin')}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Plugin Slug</label>
                <Input
                  placeholder="my-awesome-plugin"
                  value={pluginSlug}
                  onChange={(e) => setPluginSlug(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Plugin Description</label>
              <Textarea
                placeholder="Short description of what the plugin does..."
                value={pluginDescription}
                onChange={(e) => setPluginDescription(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            
            <Button
              className="w-full"
              disabled={!pluginPrompt || !pluginSlug || sessionState.isProcessing}
              onClick={handleCreatePlugin}
            >
              {sessionState.isProcessing ? <><Spinner className="mr-2" /> Generating Plugin...</> : 'Create WordPress Plugin'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="theme">
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">What theme do you want to create?</label>
              <Textarea
                placeholder="Describe the WordPress theme you want to create in detail..."
                value={themePrompt}
                onChange={(e) => setThemePrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Theme Name</label>
                <Input
                  placeholder="My Beautiful Theme"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  onBlur={() => handleGenerateSlug('theme')}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Theme Slug</label>
                <Input
                  placeholder="my-beautiful-theme"
                  value={themeSlug}
                  onChange={(e) => setThemeSlug(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Theme Description</label>
              <Textarea
                placeholder="Short description of the theme's style and features..."
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            
            <Button
              className="w-full"
              disabled={!themePrompt || !themeSlug || sessionState.isProcessing}
              onClick={handleCreateTheme}
            >
              {sessionState.isProcessing ? <><Spinner className="mr-2" /> Generating Theme...</> : 'Create WordPress Theme'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Quick tips */}
      <div className="mt-6 p-3 bg-muted rounded text-sm">
        <h3 className="font-semibold mb-1">💡 Tips for better results:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Be specific about the functionality you need</li>
          <li>Mention any WordPress hooks or APIs you want to use</li>
          <li>For plugins, specify if you need admin pages or settings</li>
          <li>For themes, describe the layout and responsive requirements</li>
        </ul>
      </div>
    </div>
  );
} 