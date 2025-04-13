"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PlaygroundClient } from "@wp-playground/client";

const PLUGIN_BASE_PATH = "/wordpress/wp-content/plugins";

interface ExtendedPlaygroundClient extends PlaygroundClient {
    dispose: () => Promise<void>;
}

interface WordPressPlaygroundProps {
    files: Record<string, any>;
    className?: string;
}

const WordPressPlayground: React.FC<WordPressPlaygroundProps> = ({ files, className = "" }) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const clientRef = useRef<ExtendedPlaygroundClient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loadingStatus, setLoadingStatus] = useState("Initializing WordPress Playground...");

    useEffect(() => {
        if (!files) return;

        let isSubscribed = true;  // Add cleanup flag

        // Recursively extract file paths & content from the nested object
        const extractFileSteps = (fileStructure: Record<string, any>, path = PLUGIN_BASE_PATH) => {
            let steps: any[] = [];

            Object.entries(fileStructure).forEach(([name, item]) => {
                const fullPath = `${path}/${name}`;

                if (item.type === "file") {
                    steps.push({
                        step: "writeFile",
                        path: fullPath,
                        data: item.content || "",
                    });
                } else if (item.type === "folder" && item.children) {
                    steps.push({ step: "mkdir", path: fullPath });
                    steps = [...steps, ...extractFileSteps(item.children, fullPath)];
                }
            });

            return steps;
        };

        const fileSteps = extractFileSteps(files);
        console.log("📂 WordPress Playground File Steps:", fileSteps);

        const loadPlayground = async () => {
            try {
                // Cleanup existing client if it exists
                if (clientRef.current) {
                    try {
                        setLoadingStatus("Cleaning up previous instance...");
                        await clientRef.current.dispose();
                        clientRef.current = null;
                    } catch (e) {
                        console.warn('Error disposing previous client:', e);
                    }
                }

                if (!isSubscribed) return;  // Check if component is still mounted

                setLoading(true);
                setError(null);
                setLoadingStatus("Loading WordPress Playground module...");

                const wpPlaygroundModule = await import("@wp-playground/client");
                const { startPlaygroundWeb } = wpPlaygroundModule;

                if (!startPlaygroundWeb || !iframeRef.current) {
                    throw new Error("Failed to load WordPress Playground. Missing iframe or startPlaygroundWeb function.");
                }

                if (!isSubscribed) return;  // Check again before initialization
                setLoadingStatus("Setting up WordPress environment...");

                // Determine if there's a specific plugin to activate
                let pluginPath = 'my-plugin/my-plugin.php'; // Default path
                // Try to find actual PHP files that might be the main plugin file
                Object.entries(files).forEach(([dirName, value]) => {
                    if (value.type === 'folder' && value.children) {
                        Object.entries(value.children).forEach(([filename, fileValue]) => {
                            if (filename.endsWith('.php') && 
                                fileValue && 
                                typeof fileValue === 'object' && 
                                'type' in fileValue &&
                                fileValue.type === 'file' &&
                                'content' in fileValue &&
                                typeof fileValue.content === 'string' && 
                                fileValue.content.includes('Plugin Name:')) {
                                pluginPath = `${dirName}/${filename}`;
                            }
                        });
                    }
                });

                // Initialize WordPress Playground
                setLoadingStatus("Initializing WordPress Playground...");
                clientRef.current = await startPlaygroundWeb({
                    iframe: iframeRef.current,
                    remoteUrl: "https://playground.wordpress.net/remote.html",
                    blueprint: {
                        login: true,
                        landingPage: "/wp-admin/plugins.php",
                        preferredVersions: {
                            php: '8.0',
                            wp: 'latest'
                        },
                        siteOptions: { 
                            blogname: "Plugin Preview",
                            blogdescription: "Testing your WordPress plugin"
                        },
                        steps: [
                            {
                                step: "installTheme",
                                themeData: {
                                    resource: "wordpress.org/themes",
                                    slug: "twentytwentythree",
                                },
                            },
                            { step: "mkdir", path: PLUGIN_BASE_PATH },
                            ...fileSteps,
                            {
                                step: "runPHP",
                                code: `<?php
                  require_once '/wordpress/wp-load.php';
                  require_once ABSPATH . 'wp-admin/includes/plugin.php';

                  // Ensure file exists before activating
                  $plugin_file = ABSPATH . 'wp-content/plugins/${pluginPath}';
                  if (!file_exists($plugin_file)) {
                      error_log('Plugin file not found at: ' . $plugin_file);
                      // Try to find any PHP files in the plugins directory
                      $plugin_dir = ABSPATH . 'wp-content/plugins/';
                      $found_files = glob($plugin_dir . '*/*.php');
                      error_log('Available plugin files: ' . print_r($found_files, true));
                      
                      if (!empty($found_files)) {
                          // Try to activate the first plugin we find
                          $relative_path = str_replace($plugin_dir, '', $found_files[0]);
                          error_log('Attempting to activate: ' . $relative_path);
                          $result = activate_plugin($relative_path);
                          if (is_wp_error($result)) {
                              error_log('Plugin activation failed: ' . $result->get_error_message());
                          } else {
                              error_log('Plugin activated successfully: ' . $relative_path);
                          }
                      }
                  } else {
                      error_log('Plugin file found, activating: ' . $plugin_file);
                      $result = activate_plugin('${pluginPath}');
                      if (is_wp_error($result)) {
                          error_log('Plugin activation failed: ' . $result->get_error_message());
                      } else {
                          error_log('Plugin activated successfully: ${pluginPath}');
                      }
                  }
                ?>`,
                            },
                        ],
                    },
                }) as ExtendedPlaygroundClient;

                if (!isSubscribed) {
                    // Cleanup if component unmounted during initialization
                    clientRef.current?.dispose();
                    return;
                }

                console.log("WordPress Playground initialized successfully!");
                setLoadingStatus("WordPress Playground loaded successfully!");
                setLoading(false);
            } catch (error) {
                if (!isSubscribed) return;
                console.error("Error loading WordPress Playground:", error);
                setError(error instanceof Error ? error.message : "Unknown error occurred.");
                setLoading(false);
            }
        };

        loadPlayground();

        // Cleanup function
        return () => {
            isSubscribed = false;
            if (clientRef.current) {
                clientRef.current.dispose().catch(console.error);
                clientRef.current = null;
            }
        };
    }, [files]); 

    return (
        <div className={`wordpress-playground-container relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex justify-center items-center">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
                        <p className="text-center mb-2 font-medium">{loadingStatus}</p>
                        <p className="text-xs text-gray-500">This may take a few moments...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
                    <p className="font-bold">Error Loading WordPress Playground</p>
                    <p>{error}</p>
                    <div className="mt-4 p-3 bg-red-100 rounded text-xs font-mono overflow-auto">
                        <p>Debug info:</p>
                        <p>Iframe ready: {iframeRef.current ? 'Yes' : 'No'}</p>
                        <p>Client initialized: {clientRef.current ? 'Yes' : 'No'}</p>
                        <p>Files count: {Object.keys(files).length}</p>
                    </div>
                </div>
            )}

            <iframe
                ref={iframeRef}
                id="wp-playground"
                className={`w-full h-full border-0 ${loading || error ? "hidden" : "block"}`}
                title="WordPress Playground"
                allow="clipboard-write"
            />
        </div>
    );
};

export default WordPressPlayground; 