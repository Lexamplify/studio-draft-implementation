/**
 * Template Content Processor
 * 
 * This utility handles processing of template content to ensure
 * TipTap JSON format is properly handled across all components.
 * 
 * It works the same way as the import functionality to ensure
 * consistent behavior between templates and imported documents.
 */

/**
 * Process template content for Convex storage (always returns string)
 */
export const processTemplateContentForConvex = (content: string | undefined): string | undefined => {
  if (!content) return undefined;

  // If content is already a string that looks like HTML, return as-is
  if (typeof content === 'string' && !content.trim().startsWith('{')) {
    return content;
  }

  // Try to parse as JSON (TipTap format)
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "doc" && Array.isArray(parsed.content)) {
      console.log("✅ Content contains TipTap JSON, preserving all formatting");
      // Return as JSON string for Convex storage
      return JSON.stringify(parsed);
    }
  } catch {
    // If parsing fails, return the original content
    console.log("Content is not JSON, using as-is");
  }

  return content;
};

/**
 * Process template content for Firestore storage (always returns string)
 * This is an alias for processTemplateContentForConvex since both use the same logic
 */
export const processTemplateContentForFirestore = (content: string | object | undefined): string | undefined => {
  if (!content) return undefined;

  // If content is already a string, use it directly
  if (typeof content === 'string') {
    // If it's HTML, return as-is
    if (!content.trim().startsWith('{')) {
      return content;
    }
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === "doc" && Array.isArray(parsed.content)) {
        console.log("✅ Content contains TipTap JSON, preserving all formatting");
        // Return as JSON string for Firestore storage
        return JSON.stringify(parsed);
      }
    } catch {
      // If parsing fails, return the original content
      return content;
    }
    return content;
  }

  // If content is already an object (TipTap JSON format)
  if (typeof content === 'object' && content !== null) {
    if ('type' in content && content.type === "doc" && 'content' in content && Array.isArray(content.content)) {
      console.log("✅ Content is TipTap JSON object, converting to string for Firestore");
      return JSON.stringify(content);
    }
  }

  // Fallback: convert to string
  return typeof content === 'string' ? content : JSON.stringify(content);
};

/**
 * Process template content for TipTap editor (can return object)
 */
export const processTemplateContent = (content: string | undefined) => {
  if (!content) return undefined;

  // If content is already a string that looks like HTML, return as-is
  if (typeof content === 'string' && !content.trim().startsWith('{')) {
    return content;
  }

  // Try to parse as JSON (TipTap format)
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === "doc" && Array.isArray(parsed.content)) {
      console.log("✅ Content contains TipTap JSON, preserving all formatting");
      // Return the parsed object for TipTap editor
      return parsed;
    }
  } catch {
    // If parsing fails, return the original content
    console.log("Content is not JSON, using as-is");
  }

  return content;
};

/**
 * Validates if content is a valid TipTap JSON document
 */
export const isValidTipTapDocument = (content: unknown): boolean => {
  return !!(
    content &&
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    content.type === "doc" &&
    'content' in content &&
    Array.isArray(content.content) &&
    content.content.every((item: unknown) => 
      item && typeof item === 'object' && item !== null && 'type' in item && typeof item.type === 'string'
    )
  );
};

/**
 * Converts content to TipTap JSON format if it's not already
 */
export const ensureTipTapFormat = (content: string): string | object => {
  // If it's already a valid TipTap document, return as object
  try {
    const parsed = JSON.parse(content);
    if (isValidTipTapDocument(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, continue with string processing
  }

  // If it's HTML or plain text, return as string for HTML processing
  return content;
};
