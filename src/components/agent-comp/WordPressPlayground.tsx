"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaygroundClient } from "@wp-playground/client";
import { CodeFile } from "@/lib/services/agentService";

const PLUGIN_BASE_PATH = "/wordpress/wp-content/plugins";

interface ExtendedPlaygroundClient extends PlaygroundClient {
    dispose: () => Promise<void>;
}

interface WordPressPlaygroundProps {
    files: Record<string, any>;
}

const WordPressPlayground: React.FC<WordPressPlaygroundProps> = ({ files }) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const clientRef = useRef<ExtendedPlaygroundClient | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!files) return;

        let isSubscribed = true;  // Add cleanup flag

        // ✅ Recursively extract file paths & content from the nested object
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
        console.log("📂 File Steps:", fileSteps);

        const loadPlayground = async () => {
            try {
                // Cleanup existing client if it exists
                if (clientRef.current) {
                    try {
                        await clientRef.current.dispose();
                        clientRef.current = null;
                    } catch (e) {
                        console.warn('Error disposing previous client:', e);
                    }
                }

                if (!isSubscribed) return;  // Check if component is still mounted

                setLoading(true);
                setError(null);

                const wpPlaygroundModule = await import("@wp-playground/client");
                const { startPlaygroundWeb } = wpPlaygroundModule;

                if (!startPlaygroundWeb || !iframeRef.current) {
                    throw new Error("Failed to load WordPress Playground.");
                }

                if (!isSubscribed) return;  // Check again before initialization

                // Initialize WordPress Playground
                clientRef.current = await startPlaygroundWeb({
                    iframe: iframeRef.current,
                    remoteUrl: "https://playground.wordpress.net/remote.html",
                    blueprint: {
                        login: true,
                        siteOptions: { blogname: "Plugin Preview" },
                        steps: [
                            {
                                step: "installTheme",
                                themeData: {
                                    resource: "wordpress.org/themes",
                                    slug: "adventurer",
                                },
                            },
                            { step: "mkdir", path: PLUGIN_BASE_PATH },
                            ...fileSteps,
                            {
                                step: "runPHP",
                                code: `<?php
                  require_once '/wordpress/wp-load.php';
                  require_once ABSPATH . 'wp-admin/includes/plugin.php';

                  // ✅ Ensure file exists before activating
                  $plugin_file = ABSPATH . 'wp-content/plugins/my-plugin/my-plugin.php';
                  if (!file_exists($plugin_file)) {
                      error_log('🚨 Plugin file not found at: ' . $plugin_file);
                  } else {
                      error_log('✅ Plugin file found, activating...');
                      $result = activate_plugin('my-plugin/my-plugin.php');
                      if (is_wp_error($result)) {
                          error_log('❌ Plugin activation failed: ' . $result->get_error_message());
                      } else {
                          error_log('✅ Plugin activated successfully.');
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

                console.log("✅ WordPress Playground initialized successfully!");
                setLoading(false);
            } catch (error) {
                if (!isSubscribed) return;
                console.error("❌ Error loading WordPress Playground:", error);
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
    }, [files]); // Add files to dependency array

    return (
        <div className="wordpress-playground-container">
            {loading && (
                <div className="flex justify-center items-center p-10">
                    <p>Loading WordPress Playground...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded m-4">
                    <p className="font-bold">Error Loading WordPress Playground</p>
                    <p>{error}</p>
                </div>
            )}

            <iframe
                ref={iframeRef}
                id="wp-playground"
                className={`w-full h-screen border-0 ${loading || error ? "hidden" : "block"}`}
                title="WordPress Playground"
            />
        </div>
    );
};

export default WordPressPlayground;
