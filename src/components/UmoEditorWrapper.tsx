"use client";

import { useEffect, useRef } from 'react'

interface UmoEditorWrapperProps {
  options?: any;
}

// This is the wrapper component that will host the Vue-based UmoEditor.
export default function UmoEditorWrapper({ options = {} }: UmoEditorWrapperProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    // This effect runs only once on the client to mount the Vue app
    if (editorRef.current && !isMounted.current) {
      isMounted.current = true;

      // Load editor CSS (Next built-in CSS handling)
      const loadCSS = async () => {
        try {
          await import('lexteam-editor');
        } catch (error) {
          console.warn('Could not import Umo Editor CSS:', error);
        }
      };
      loadCSS();

      Promise.all([
        import('vue'),
        import('lexteam-editor')
      ]).then(([{ createApp }, umoEditorModule]) => {
        // Use type assertion to bypass TypeScript errors
        const module = umoEditorModule as any;
        
        // Try to find the editor component and plugin
        const UmoEditor = module.default || module.UmoEditor || module;
        const useUmoEditor = module.useUmoEditor || (() => ({}));
        
        const app = createApp(UmoEditor);
        app.use(useUmoEditor, options);
        app.mount(editorRef.current!);
      }).catch((error) => {
        console.error('Failed to load Umo Editor:', error);
      });
    }
  }, [options]); // Re-run if options change

  return <div ref={editorRef} className="h-full w-full" />;
}