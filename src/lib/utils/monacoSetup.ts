/**
 * Monaco Editor Setup with VS Code-like Syntax Highlighting
 * This file configures Monaco Editor to match VS Code's color scheme and behavior
 */

import type { Monaco } from '@monaco-editor/react';

/**
 * Configures Monaco Editor with VS Code-like themes and options
 * @param monaco Monaco instance
 */
export const setupMonacoVSCodeTheme = (monaco: Monaco): void => {
  // Configure JavaScript and TypeScript languages first
  configureLanguages(monaco);
  
  // Define custom VS Code Dark+ theme
  monaco.editor.defineTheme('vs-code-dark-plus', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      // Basic tokens with stronger colors
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0', fontStyle: 'bold' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'variable.predefined', foreground: '4FC1FF' },
      { token: 'interface', foreground: '4EC9B0' },
      { token: 'enum', foreground: '4EC9B0' },
      { token: 'structure', foreground: '4EC9B0' },
      { token: 'parameter', foreground: '9CDCFE' },
      { token: 'typeParameter', foreground: '4EC9B0' },
      { token: 'namespace', foreground: '9CDCFE' },
      
      // JavaScript/TypeScript specific
      { token: 'delimiter.bracket', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'constant', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'boolean', foreground: '569CD6', fontStyle: 'bold' },
      
      // Named colors for better consistency
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'parameter.name', foreground: '9CDCFE' },
      { token: 'property.name', foreground: '9CDCFE' },
      { token: 'property', foreground: '9CDCFE' },
      { token: 'member', foreground: '9CDCFE' },

      // React/JSX specific with stronger colors
      { token: 'tag', foreground: '569CD6' },
      { token: 'tag.id', foreground: '569CD6' },
      { token: 'tag.attribute', foreground: '9CDCFE' },
      { token: 'attribute.name', foreground: '9CDCFE' },
      { token: 'attribute.value', foreground: 'CE9178' },
      { token: 'metatag', foreground: '569CD6' },
      { token: 'metatag.content', foreground: 'CE9178' },
      { token: 'metatag.attribute', foreground: '9CDCFE' },
      
      // HTML specific
      { token: 'tag.html', foreground: '569CD6' },
      { token: 'attribute.name.html', foreground: '9CDCFE' },
      { token: 'attribute.value.html', foreground: 'CE9178' },
      
      // Additional strong tokens
      { token: 'string.key', foreground: '9CDCFE' },
      { token: 'string.value', foreground: 'CE9178' },
      { token: 'keyword.flow', foreground: 'C586C0' },
      { token: 'keyword.json', foreground: 'C586C0' },
    ],
    colors: {
      // VS Code exact editor colors
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorCursor.foreground': '#AEAFAD',
      'editor.lineHighlightBackground': '#2D2D30',
      'editor.lineHighlightBorder': '#282828',
      'editorSuggestWidget.background': '#252526',
      'editorSuggestWidget.border': '#454545',
      'editorSuggestWidget.foreground': '#D4D4D4',
      'editorSuggestWidget.selectedBackground': '#062F4A',
      'editorWhitespace.foreground': '#3B3B3B',
      'editor.findMatchBackground': '#515C6A',
      'editor.findMatchHighlightBackground': '#515C6A80',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editorBracketMatch.background': '#0D3A58',
      'editorBracketMatch.border': '#094771',
      'editor.wordHighlightBackground': '#575757B8',
      'editor.wordHighlightStrongBackground': '#004972B8',
    }
  });

  // Define custom VS Code Light theme with stronger colors
  monaco.editor.defineTheme('vs-code-light', {
    base: 'vs',
    inherit: true,
    rules: [
      // Basic tokens with stronger colors
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'string', foreground: 'A31515' },
      { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'number', foreground: '098658' },
      { token: 'regexp', foreground: 'E50000' },
      { token: 'type', foreground: '267F99' },
      { token: 'class', foreground: '267F99', fontStyle: 'bold' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
      { token: 'variable.predefined', foreground: '0070C1' },
      { token: 'interface', foreground: '267F99' },
      { token: 'enum', foreground: '267F99' },
      { token: 'structure', foreground: '267F99' },
      
      // Named colors for better consistency
      { token: 'identifier', foreground: '001080' },
      { token: 'parameter.name', foreground: '001080' },
      { token: 'property.name', foreground: '001080' },
      { token: 'property', foreground: '001080' },
      { token: 'member', foreground: '001080' },
      
      // JavaScript/TypeScript specific
      { token: 'delimiter.bracket', foreground: '000000' },
      { token: 'delimiter', foreground: '000000' },
      { token: 'operator', foreground: '000000' },
      { token: 'constant', foreground: '0000FF', fontStyle: 'bold' },
      { token: 'boolean', foreground: '0000FF', fontStyle: 'bold' },

      // React/JSX specific with stronger colors
      { token: 'tag', foreground: '0000FF' },
      { token: 'tag.id', foreground: '0000FF' },
      { token: 'tag.attribute', foreground: 'FF0000' },
      { token: 'attribute.name', foreground: 'FF0000' },
      { token: 'attribute.value', foreground: 'A31515' },
      { token: 'metatag', foreground: '0000FF' },
      { token: 'metatag.content', foreground: 'A31515' },
      { token: 'metatag.attribute', foreground: 'FF0000' },
      
      // HTML specific
      { token: 'tag.html', foreground: '0000FF' },
      { token: 'attribute.name.html', foreground: 'FF0000' },
      { token: 'attribute.value.html', foreground: 'A31515' },
      
      // Additional strong tokens
      { token: 'string.key', foreground: '001080' },
      { token: 'string.value', foreground: 'A31515' },
      { token: 'keyword.flow', foreground: 'AF00DB' },
      { token: 'keyword.json', foreground: 'AF00DB' },
    ],
    colors: {
      // VS Code exact editor colors
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#A0A0A0',
      'editorLineNumber.activeForeground': '#333333',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editorCursor.foreground': '#000000',
      'editor.lineHighlightBackground': '#F3F3F3',
      'editor.lineHighlightBorder': '#EEEEEE',
      'editorSuggestWidget.background': '#F3F3F3',
      'editorSuggestWidget.border': '#C8C8C8',
      'editorSuggestWidget.foreground': '#000000',
      'editorSuggestWidget.selectedBackground': '#D6EBFF',
      'editorWhitespace.foreground': '#D3D3D3',
      'editor.findMatchBackground': '#A8AC94',
      'editor.findMatchHighlightBackground': '#A8AC9450',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#A9A9A9',
      'editorBracketMatch.background': '#D6EBFF',
      'editorBracketMatch.border': '#BCD2EE',
      'editor.wordHighlightBackground': '#AADCFF44',
      'editor.wordHighlightStrongBackground': '#92C4F344',
    }
  });
}

/**
 * Configure language-specific settings
 */
function configureLanguages(monaco: Monaco): void {
  // JavaScript settings
  const jsDefaults = monaco.languages.typescript.javascriptDefaults;
  jsDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    jsxFactory: 'React.createElement',
    reactNamespace: 'React',
    allowNonTsExtensions: true,
    allowJs: true,
    target: monaco.languages.typescript.ScriptTarget.Latest,
  });
  
  // Add extra libraries for autocomplete and highlighting
  jsDefaults.addExtraLib(
    `
    declare module 'react' {
      export default React;
      export namespace React {
        function createElement(type: any, props?: any, ...children: any[]): any;
        function useState<T>(initialState: T): [T, (newState: T) => void];
        function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        function useRef<T>(initialValue: T): { current: T };
        function useContext<T>(context: any): T;
        function useMemo<T>(factory: () => T, deps?: any[]): T;
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
      }
    }
    `,
    'react.d.ts'
  );
  
  // TypeScript settings
  const tsDefaults = monaco.languages.typescript.typescriptDefaults;
  tsDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    jsxFactory: 'React.createElement',
    reactNamespace: 'React',
    allowNonTsExtensions: true,
    allowJs: true,
    target: monaco.languages.typescript.ScriptTarget.Latest,
  });
  
  // Add extra libraries for TypeScript too
  tsDefaults.addExtraLib(
    `
    declare module 'react' {
      export default React;
      export namespace React {
        function createElement(type: any, props?: any, ...children: any[]): any;
        function useState<T>(initialState: T): [T, (newState: T) => void];
        function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        function useRef<T>(initialValue: T): { current: T };
        function useContext<T>(context: any): T;
        function useMemo<T>(factory: () => T, deps?: any[]): T;
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
      }
    }
    `,
    'react.d.ts'
  );
}

export default setupMonacoVSCodeTheme; 