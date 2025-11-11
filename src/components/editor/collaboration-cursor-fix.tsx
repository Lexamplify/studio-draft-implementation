"use client";

import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/core";
import { useOthers } from "@liveblocks/react";

interface CollaborationCursorFixProps {
  editor: Editor | null;
}

export function CollaborationCursorFix({ editor }: CollaborationCursorFixProps) {
  const observerRef = useRef<MutationObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const others = useOthers();

  useEffect(() => {
    if (!editor) {
      console.log('⚠️ CollaborationCursorFix: Editor not available');
      return;
    }

    const editorElement = editor.view.dom.closest(".ProseMirror") || editor.view.dom;
    if (!editorElement) {
      console.log('⚠️ CollaborationCursorFix: Editor element not found');
      return;
    }

    console.log('✅ CollaborationCursorFix: Initialized', { 
      editorElement, 
      editorAvailable: !!editor,
      othersCount: others.length 
    });

    // Function to process cursor elements
    const processCursorElements = () => {
      // First, try to find yellow highlighted elements (most common case)
      const allElements = editorElement.querySelectorAll('*');
      const yellowElements: HTMLElement[] = [];
      
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const styles = window.getComputedStyle(htmlEl);
        const bgColor = styles.backgroundColor;
        const textContent = htmlEl.textContent?.trim() || '';
        
        // Check for yellow background
        if (
          (bgColor.includes('rgb(255, 255') || 
           bgColor.includes('yellow') ||
           htmlEl.style.backgroundColor?.includes('yellow') ||
           htmlEl.getAttribute('style')?.includes('yellow')) &&
          textContent.length > 0 &&
          textContent.length < 100 &&
          /^[a-zA-Z\s]+$/.test(textContent) &&
          !htmlEl.hasAttribute('data-cursor-processed')
        ) {
          yellowElements.push(htmlEl);
        }
      });

      // Process yellow highlighted elements
      yellowElements.forEach((cursorEl) => {
        // Skip if already processed
        if (cursorEl.dataset.cursorProcessed === 'true') return;

        // Extract user name from text content
        const textContent = cursorEl.textContent?.trim() || '';
        let userName = '';
        
        // Extract from text content (most common case - yellow highlighted text)
        if (textContent && textContent.length < 100 && /^[a-zA-Z\s]+$/.test(textContent)) {
          userName = textContent.replace(/[()]/g, '').trim();
        }
        
        // Try to get name from nested span/text
        if (!userName) {
          const textSpan = cursorEl.querySelector('span');
          if (textSpan) {
            userName = textSpan.textContent?.trim() || '';
          }
        }
        
        // Fallback: try data attributes
        if (!userName) {
          userName = cursorEl.dataset.userName || 
                     cursorEl.dataset.user || 
                     cursorEl.dataset.name || 
                     cursorEl.getAttribute('data-user-name') || 
                     '';
        }
        
        // Fallback: try to get from Liveblocks others
        if (!userName && cursorEl.dataset.userId) {
          const user = others.find(
            (other) => other.id === cursorEl.dataset.userId
          );
          userName = user?.info?.name || '';
        }
        
        // Log for debugging
        if (userName) {
          console.log('Found collaboration cursor:', { userName, element: cursorEl });
        }

        // Set the username attribute for CSS tooltip
        if (userName) {
          cursorEl.setAttribute('data-username', userName);
          cursorEl.setAttribute('data-user-name', userName); // Also set for compatibility
        }

        // Extract and apply user color
        const userColor = cursorEl.dataset.userColor || 
                          cursorEl.dataset.color || 
                          cursorEl.style.borderLeftColor || 
                          '#3b82f6'; // default blue

        // Hide all child elements that contain text
        const allChildren = cursorEl.querySelectorAll('*');
        allChildren.forEach((child) => {
          const childEl = child as HTMLElement;
          childEl.style.display = 'none';
          childEl.style.visibility = 'hidden';
          childEl.style.opacity = '0';
          childEl.style.fontSize = '0';
          if (childEl.textContent?.includes(userName)) {
            childEl.textContent = '';
          }
        });

        // Remove text nodes
        const walker = document.createTreeWalker(
          cursorEl,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const textNodes: Node[] = [];
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent?.trim() === userName || node.textContent?.includes(userName)) {
            textNodes.push(node);
          }
        }
        
        textNodes.forEach((textNode) => {
          textNode.textContent = '\u200B'; // Zero-width space
        });

        // Apply thin cursor line style
        cursorEl.style.setProperty('width', '2px', 'important');
        cursorEl.style.setProperty('min-width', '2px', 'important');
        cursorEl.style.setProperty('height', '1.2em', 'important');
        cursorEl.style.setProperty('display', 'inline-block', 'important');
        cursorEl.style.setProperty('vertical-align', 'baseline', 'important');
        cursorEl.style.setProperty('margin', '0 1px', 'important');
        cursorEl.style.setProperty('padding', '0', 'important');
        cursorEl.style.setProperty('border-left', `2px solid ${userColor}`, 'important');
        cursorEl.style.setProperty('border-right', 'none', 'important');
        cursorEl.style.setProperty('border-top', 'none', 'important');
        cursorEl.style.setProperty('border-bottom', 'none', 'important');
        cursorEl.style.setProperty('border-radius', '0', 'important');
        cursorEl.style.setProperty('background-color', 'transparent', 'important');
        cursorEl.style.setProperty('background', 'transparent', 'important');
        cursorEl.style.setProperty('line-height', 'inherit', 'important');
        cursorEl.style.setProperty('cursor', 'pointer', 'important');
        cursorEl.style.setProperty('pointer-events', 'auto', 'important');
        cursorEl.style.setProperty('position', 'relative', 'important');
        cursorEl.style.setProperty('text-indent', '-9999px', 'important');
        cursorEl.style.setProperty('overflow', 'visible', 'important');
        cursorEl.style.setProperty('color', 'transparent', 'important');
        cursorEl.style.setProperty('font-size', '0', 'important');

        // Mark as processed
        cursorEl.dataset.cursorProcessed = 'true';
      });

      // Also try common selectors for collaboration cursors
      const selectors = [
        '.collaboration-cursor__caret',
        '.collaboration-cursor__label',
        '[data-collaboration-cursor]',
        '.collaboration-cursor',
        'span[data-user]',
        '[class*="collaboration-cursor"]',
        '[class*="collaborationCursor"]',
      ];

      selectors.forEach((selector) => {
        const cursorElements = editorElement.querySelectorAll(selector);
        
        cursorElements.forEach((element) => {
          const cursorEl = element as HTMLElement;
          
          // Skip if already processed
          if (cursorEl.dataset.cursorProcessed === 'true') return;

          // Extract user name from text content or data attributes
          let userName = '';
          
          // First, check for .collaboration-cursor__label (most specific)
          const labelDiv = cursorEl.querySelector('.collaboration-cursor__label') || 
                          (cursorEl.classList.contains('collaboration-cursor__label') ? cursorEl : null);
          if (labelDiv) {
            const labelEl = labelDiv as HTMLElement;
            userName = labelEl.textContent?.trim() || '';
            // Hide the label div completely
            labelEl.style.setProperty('display', 'none', 'important');
            labelEl.style.setProperty('visibility', 'hidden', 'important');
            labelEl.style.setProperty('opacity', '0', 'important');
            labelEl.style.setProperty('font-size', '0', 'important');
            labelEl.style.setProperty('width', '0', 'important');
            labelEl.style.setProperty('height', '0', 'important');
            labelEl.style.setProperty('overflow', 'hidden', 'important');
            labelEl.style.setProperty('text-indent', '-9999px', 'important');
            labelEl.style.setProperty('color', 'transparent', 'important');
            // Clear text content
            labelEl.textContent = '';
            // Also hide all child elements
            labelEl.querySelectorAll('*').forEach((child) => {
              const childEl = child as HTMLElement;
              childEl.style.setProperty('display', 'none', 'important');
              childEl.style.setProperty('visibility', 'hidden', 'important');
              childEl.textContent = '';
            });
          }
          
          // Try to get name from nested span/text
          if (!userName) {
            const textSpan = cursorEl.querySelector('span');
            if (textSpan) {
              userName = textSpan.textContent?.trim() || '';
              // Hide the text span
              (textSpan as HTMLElement).style.setProperty('display', 'none', 'important');
              (textSpan as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
              (textSpan as HTMLElement).style.setProperty('font-size', '0', 'important');
              (textSpan as HTMLElement).style.setProperty('width', '0', 'important');
              (textSpan as HTMLElement).style.setProperty('height', '0', 'important');
              (textSpan as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
            }
          }
          
          // Fallback: try data attributes
          if (!userName) {
            userName = cursorEl.dataset.userName || 
                       cursorEl.dataset.user || 
                       cursorEl.dataset.name || 
                       cursorEl.getAttribute('data-user-name') || 
                       '';
          }
          
          // Fallback: try to get from Liveblocks others
          if (!userName && cursorEl.dataset.userId) {
            const user = others.find(
              (other) => other.id === cursorEl.dataset.userId
            );
            userName = user?.info?.name || '';
          }
          
          // Fallback: extract from text content if it's the cursor element itself
          if (!userName) {
            const text = cursorEl.textContent?.trim() || '';
            // If text looks like a name (not just whitespace/special chars)
            if (text && text.length < 50 && !/^[\s\W]+$/.test(text)) {
              userName = text;
            }
          }
          
          // If this is the label div itself, hide it completely
          if (cursorEl.classList.contains('collaboration-cursor__label')) {
            cursorEl.style.setProperty('display', 'none', 'important');
            cursorEl.style.setProperty('visibility', 'hidden', 'important');
            cursorEl.style.setProperty('opacity', '0', 'important');
            cursorEl.style.setProperty('font-size', '0', 'important');
            cursorEl.style.setProperty('width', '0', 'important');
            cursorEl.style.setProperty('height', '0', 'important');
            cursorEl.style.setProperty('overflow', 'hidden', 'important');
            cursorEl.style.setProperty('text-indent', '-9999px', 'important');
            cursorEl.style.setProperty('color', 'transparent', 'important');
            cursorEl.textContent = '';
          }

          // Set the username attribute for CSS tooltip
          if (userName) {
            cursorEl.setAttribute('data-username', userName);
            cursorEl.setAttribute('data-user-name', userName);
          }

          // Extract and apply user color
          const userColor = cursorEl.dataset.userColor || 
                            cursorEl.dataset.color || 
                            cursorEl.style.borderLeftColor || 
                            cursorEl.style.backgroundColor || 
                            '#3b82f6'; // default blue

          // Apply thin cursor line style
          cursorEl.style.width = '2px';
          cursorEl.style.minWidth = '2px';
          cursorEl.style.height = '1.2em';
          cursorEl.style.display = 'inline-block';
          cursorEl.style.verticalAlign = 'baseline';
          cursorEl.style.margin = '0 1px';
          cursorEl.style.padding = '0';
          cursorEl.style.borderLeft = `2px solid ${userColor}`;
          cursorEl.style.borderRight = 'none';
          cursorEl.style.borderTop = 'none';
          cursorEl.style.borderBottom = 'none';
          cursorEl.style.borderRadius = '0';
          cursorEl.style.backgroundColor = 'transparent';
          cursorEl.style.background = 'transparent';
          cursorEl.style.lineHeight = 'inherit';
          cursorEl.style.cursor = 'pointer';
          cursorEl.style.pointerEvents = 'auto';
          cursorEl.style.position = 'relative';

          // Hide any text content
          cursorEl.style.textIndent = '-9999px';
          cursorEl.style.overflow = 'hidden';
          cursorEl.style.color = 'transparent';
          cursorEl.style.fontSize = '0';

          // Mark as processed
          cursorEl.dataset.cursorProcessed = 'true';
        });
      });
    };

    // Debug: Log all elements with yellow background
    const debugYellowElements = () => {
      const allEls = editorElement.querySelectorAll('*');
      const yellowEls: Array<{element: HTMLElement, text: string, bg: string}> = [];
      allEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const styles = window.getComputedStyle(htmlEl);
        const bg = styles.backgroundColor;
        if (bg.includes('rgb(255, 255') || bg.includes('yellow')) {
          yellowEls.push({
            element: htmlEl,
            text: htmlEl.textContent?.trim() || '',
            bg: bg
          });
        }
      });
      if (yellowEls.length > 0) {
        console.log('🔍 Found yellow elements:', yellowEls);
      }
    };

    // Initial processing
    setTimeout(() => {
      debugYellowElements();
      processCursorElements();
    }, 500);

    // Set up MutationObserver to watch for new cursor elements
    observerRef.current = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const styles = window.getComputedStyle(el);
              // Check for yellow background or collaboration cursor patterns
              if (
                el.matches('[data-collaboration-cursor], .collaboration-cursor, span[data-user], [class*="collaboration-cursor"]') ||
                el.querySelector('[data-collaboration-cursor], .collaboration-cursor, span[data-user], [class*="collaboration-cursor"]') ||
                styles.backgroundColor.includes('rgb(255, 255') ||
                styles.backgroundColor.includes('yellow')
              ) {
                shouldProcess = true;
              }
            }
          });
        }
        
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (
            target.matches('[data-collaboration-cursor], .collaboration-cursor, span[data-user], [class*="collaboration-cursor"]') ||
            target.getAttribute('style')?.includes('yellow')
          ) {
            shouldProcess = true;
          }
        }
      });
      
      if (shouldProcess) {
        // Debounce processing
        setTimeout(processCursorElements, 50);
      }
    });

    // Start observing
    observerRef.current.observe(editorElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-user', 'data-collaboration-cursor', 'style', 'data-username', 'data-user-name'],
    });

    // Also process on editor updates
    const handleUpdate = () => {
      setTimeout(() => {
        debugYellowElements();
        processCursorElements();
      }, 100);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);

    // Periodic check as fallback
    intervalRef.current = setInterval(() => {
      processCursorElements();
    }, 2000);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor, others]);

  return null; // This component doesn't render anything
}
