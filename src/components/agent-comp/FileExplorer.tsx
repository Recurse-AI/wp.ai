"use client";
import React, { useState, useEffect } from "react";
import { FiFolder, FiFile, FiFolderPlus, FiChevronDown } from "react-icons/fi";
import { CodeFile } from "@/lib/services/agentService";

interface FileExplorerProps {
  onFileSelect: (file: CodeFile) => void;
  selectedFileId?: string;
  onFilesChange?: (files: Record<string, FileNode>) => void;
  dynamicFiles?: Record<string, FileNode>;
}

interface FileNode {
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: Record<string, FileNode>;
}

// ✅ WordPress Plugin Structure (Renamed to "my-plugin")
const PLUGIN_FILES: Record<string, FileNode> = {
  "my-plugin": {
    type: "folder",
    children: {
      "my-plugin.php": {
        type: "file",
        content: `<?php
/*
Plugin Name: My Plugin
Description: Adds a 'Generate Image' button to the media library to generate AI images.
Version: 1.0
Author:  Mehedi Hasan
Author URI: https://github.com/MehediHasan-75
*/

// Hook into the media library to add the button
add_action('admin_enqueue_scripts', 'my_plugin_enqueue_scripts');

function my_plugin_enqueue_scripts() {
    if (get_current_screen()->id === 'upload') {
        wp_enqueue_script(
            'my-plugin-script',
            plugin_dir_url(__FILE__) . 'script.js',
            array('jquery'),
            '1.0',
            true
        );

        wp_enqueue_style(
            'my-plugin-style',
            plugin_dir_url(__FILE__) . 'style.css',
            array(),
            '1.0'
        );

        wp_localize_script('my-plugin-script', 'my_plugin_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
        ));
    }
}

add_action('wp_ajax_my_plugin', 'handle_my_plugin');

function handle_my_plugin() {
    $prompt = sanitize_text_field($_POST['prompt']);

    $image_url = call_dalle_api($prompt);

    if ($image_url) {
        $cloudinary_url = upload_to_cloudinary($image_url);
        if ($cloudinary_url) {
            $attachment_id = add_to_media_library($cloudinary_url);
            if ($attachment_id) {
                wp_send_json_success('Image added to the media library.');
            } else {
                wp_send_json_error('Failed to add image to the media library.');
            }
        } else {
            wp_send_json_error('Failed to upload image to Cloudinary.');
        }
    } else {
        wp_send_json_error('Failed to generate image using DALL-E 3.');
    }
}`,
        language: "php",
      },
      assets: {
        type: "folder",
        children: {
          "style.css": {
            type: "file",
            content: `#my-plugin-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 36px;
              margin-left: 10px;
          }`,
            language: "css",
          },
          "script.js": {
            type: "file",
            content: `jQuery(document).ready(function ($) {
              $('.media-toolbar-primary').append('<button id="my-plugin-btn" class="button">Generate Image</button>');

              $('#my-plugin-btn').on('click', function () {
                  let prompt = window.prompt('Enter a prompt to generate an image:');
                  if (prompt) {
                      $('body').append('<div id="loading-message" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: rgba(0, 0, 0, 0.7); color: white; padding: 10px 20px; border-radius: 5px;">Generating image...</div>');

                      $.post(my_plugin_ajax.ajax_url, {
                          action: 'my_plugin',
                          prompt: prompt,
                      }, function (response) {
                          $('#loading-message').remove();
                          if (response.success) {
                              alert('Image generated and added to the media library!');
                              location.reload();
                          } else {
                              alert('Error: ' + response.data);
                          }
                      });
                  }
              });
          });`,
            language: "js",
          },
        },
      },
    },
  },
};

const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  onFilesChange,
  dynamicFiles,
}) => {
  const [files, setFiles] = useState<Record<string, FileNode>>(
    dynamicFiles ? dynamicFiles : PLUGIN_FILES
  );

  // ✅ Handle file or folder creation
  const handleCreate = (path: string, isFolder: boolean) => {
    const name = prompt(`Enter new ${isFolder ? "folder" : "file"} name:`);
    if (!name) return;

    const newFiles = { ...files };
    if (!newFiles[path]) return;

    if (!newFiles[path].children) {
      newFiles[path].children = {};
    }

    newFiles[path].children![name] = isFolder
      ? { type: "folder", children: {} }
      : { type: "file", content: "", language: "php" };

    setFiles(newFiles);
  };

  // ✅ Render file or folder recursively
  const renderItem = (name: string, item: FileNode, path = "") => {
    const fullPath = path ? `${path}/${name}` : name;

    if (item.type === "folder") {
      return (
        <div key={fullPath}>
          <div className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <FiChevronDown className="mr-1" />
            <FiFolder className="mr-2 text-yellow-500" />
            <span>{name}</span>
            <FiFolderPlus
              className="ml-auto text-green-500 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleCreate(fullPath, true);
              }}
            />
          </div>
          <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-2">
            {Object.entries(item.children || {}).map(([childName, childItem]) =>
              renderItem(childName, childItem, fullPath)
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div
          key={fullPath}
          className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          onClick={() =>
            onFileSelect({
              id: `plugin-${fullPath}`,
              name,
              path: fullPath,
              content: item.content || "",
              language: item.language || "text",
              lastModified: new Date(),
            })
          }
        >
          <FiFile className="mr-2 text-gray-500" />
          <span>{name}</span>
        </div>
      );
    }
  };

  useEffect(() => {
    if (dynamicFiles) {
      setFiles(dynamicFiles);
      onFilesChange?.(dynamicFiles);
    }
  }, [dynamicFiles, onFilesChange]);

  return (
    <div className="h-full overflow-y-auto p-2 bg-white text-gray-800">
      <h3 className="font-medium">WordPress Plugin Files</h3>
      <div className="space-y-1">
        {Object.entries(files).map(([name, item]) => renderItem(name, item))}
      </div>
      {/* <WordPressPlayground files={currentFiles} /> */}
    </div>
  );
};

export default FileExplorer;
