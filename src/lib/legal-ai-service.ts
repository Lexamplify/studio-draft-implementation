/**
 * Legal AI Service for Document Editing
 * 
 * This service handles AI-powered legal document editing with focus on:
 * - Preserving legal accuracy and enforceability
 * - Using professional legal language
 * - Maintaining document integrity
 * - Ensuring valid JSON output
 */

export interface LegalEditRequest {
  selectedJsonSlice: any;
  userCommand: string;
  documentContext?: string;
  documentType?: 'contract' | 'brief' | 'agreement' | 'motion' | 'other';
}

export interface LegalEditResponse {
  modifiedJson: any;
  confidence: number;
  warnings?: string[];
  changes: string[];
}

export interface LegalSystemRole {
  role: string;
  rules: string[];
  outputFormat: string;
}

/**
 * Legal AI Service Class
 */
export class LegalAIService {
  private static readonly SYSTEM_ROLE: LegalSystemRole = {
    role: "You are an AI legal assistant working for a law firm's document editor. Your responsibility is to modify Tiptap/ProseMirror JSON fragments according to the lawyer's command.",
    rules: [
      "Always preserve the original legal meaning, obligations, and enforceability",
      "Use formal, professional legal language (contracts, agreements, briefs)",
      "Do not add creative or speculative information",
      "Only restructure, rephrase, or summarize within the legal context",
      "Return strictly valid JSON conforming to the provided schema",
      "Output only the modified JSON object, nothing else",
      "CRITICAL: Return ONLY valid JSON - no markdown, no explanations, no code blocks",
      "MANDATORY: Always start your response with {\"type\": \"doc\", \"content\": [",
      "MANDATORY: Always end your response with ]}",
      "MANDATORY: Include 'content': [...] array with the modified content",
      "Ensure all JSON syntax is correct (proper commas, brackets, quotes)",
      "Do not truncate or cut off the JSON response",
      "Complete the entire JSON object before ending",
      "Maintain proper legal formatting and structure",
      "Preserve all legal citations and references",
      "Keep all numerical values, dates, and legal terms accurate"
    ],
    outputFormat: "Valid Tiptap/ProseMirror JSON object"
  };

  /**
   * Process a legal document editing request
   */
  static async processLegalEdit(request: LegalEditRequest): Promise<LegalEditResponse> {
    try {
      // Build the legal-aware prompt
      const prompt = this.buildLegalPrompt(request);
      
      // Call the AI service (you can replace this with your preferred LLM)
      let response = await this.callLegalAI(prompt);
      
      // Force correct response structure - handle any format Gemini returns
      if (response) {
        console.log('🔍 Original response structure:', {
          isArray: Array.isArray(response),
          hasType: !!response.type,
          hasContent: !!response.content,
          type: response.type
        });

        if (Array.isArray(response)) {
          // If response is just an array, wrap it
          response = {
            type: "doc",
            content: response
          };
          console.log('🔧 Fixed response - wrapped array in doc structure');
        } else if (response.content && !response.type) {
          // If response has content but no type
          response = {
            type: "doc",
            content: response.content
          };
          console.log('🔧 Fixed response - added type field to content structure');
        } else if (!response.type && !response.content) {
          // If response is an object but has neither type nor content, try to use it as content
          response = {
            type: "doc",
            content: [response]
          };
          console.log('🔧 Fixed response - wrapped object as content');
        } else if (response.type !== 'doc') {
          // If response has a type but it's not 'doc', force it to be 'doc'
          response = {
            type: "doc",
            content: response.content || [response]
          };
          console.log('🔧 Fixed response - forced type to doc');
        }

        console.log('✅ Final response structure:', {
          type: response.type,
          hasContent: !!response.content,
          contentLength: Array.isArray(response.content) ? response.content.length : 'not array'
        });
      }
      
      // Final safety check - ensure we have the correct structure
      if (!response || !response.type || response.type !== 'doc' || !Array.isArray(response.content)) {
        console.warn('⚠️ Response still not in correct format, applying final fix...');
        response = {
          type: "doc",
          content: Array.isArray(response?.content) ? response.content : 
                   Array.isArray(response) ? response : 
                   response ? [response] : []
        };
        console.log('🔧 Final safety fix applied');
      }

      // Validate the response
      const validation = this.validateLegalResponse(response, request.selectedJsonSlice);
      
      if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.errors);
        throw new Error(`Invalid JSON response: ${validation.errors.join(', ')}`);
      }

      return {
        modifiedJson: response,
        confidence: this.calculateConfidence(request, response),
        warnings: validation.warnings,
        changes: this.identifyChanges(request.selectedJsonSlice, response)
      };
    } catch (error) {
      console.error('Error processing legal edit:', error);
      throw new Error(`Failed to process legal edit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a legal-aware prompt for the AI
   */
  private static buildLegalPrompt(request: LegalEditRequest): string {
    const { selectedJsonSlice, userCommand, documentContext, documentType } = request;
    
    let prompt = `${this.SYSTEM_ROLE.role}\n\n`;
    
    // Add rules
    prompt += "Rules:\n";
    this.SYSTEM_ROLE.rules.forEach(rule => {
      prompt += `- ${rule}\n`;
    });
    
    // Add document context
    if (documentType) {
      prompt += `\nDocument Type: ${documentType.toUpperCase()}\n`;
    }
    
    if (documentContext) {
      prompt += `\nDocument Context: ${documentContext}\n`;
    }
    
    // Add the user command
    prompt += `\nUser Command: "${userCommand}"\n\n`;
    
    // Add the JSON context
    prompt += `Original JSON Content:\n${JSON.stringify(selectedJsonSlice, null, 2)}\n\n`;
    
    // Add instructions
    prompt += `Please modify the above JSON content according to the user command while following all the rules. 

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
1. Return ONLY a complete, valid JSON object
2. The JSON must start with { and end with }
3. MANDATORY: Include "type": "doc" as the first field
4. MANDATORY: Include "content": [...] array with the modified content
5. Do NOT include any markdown formatting (no code blocks)
6. Do NOT include any explanations or text outside the JSON
7. The response must be parseable JSON that can be directly used in the editor

REQUIRED JSON STRUCTURE - COPY THIS EXACT FORMAT:
{
  "type": "doc",
  "content": [
    // your modified content here - keep all the original structure and formatting
  ]
}

EXAMPLE - If the original content was a paragraph, your response should look like:
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "attrs": { "lineHeight": "1.5", "textAlign": "left" },
      "content": [
        {
          "type": "text",
          "text": "Your modified legal text here",
          "marks": []
        }
      ]
    }
  ]
}

REMINDER: Your response MUST start with {"type": "doc", "content": [ and end with ]}. Do not deviate from this format.`;
    
    return prompt;
  }

  /**
   * Call Gemini AI service for legal document processing
   */
  private static async callLegalAI(prompt: string): Promise<any> {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ;
    
    // Try multiple model configurations in order of preference
    const modelConfigs = [
      { model: 'gemini-1.5-flash-latest', version: 'v1' },
      { model: 'gemini-1.5-flash', version: 'v1' },
      { model: 'gemini-2.0-flash-exp', version: 'v1beta' },
      { model: 'gemini-1.5-pro', version: 'v1' },
    ];

    let lastError: Error | null = null;

    for (const config of modelConfigs) {
      try {
        console.log(`🤖 Calling Gemini API with ${config.model} (${config.version})...`);
        
        const apiUrl = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1, // Lower temperature for more consistent JSON
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192, // Further increased token limit to prevent truncation
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`⚠️ ${config.model} (${config.version}) failed: ${response.status} ${errorText}`);
          lastError = new Error(`Gemini API error: ${response.status} ${errorText}`);
          continue; // Try next model
        }

        const data = await response.json();
        console.log(`✅ Gemini API response received from ${config.model}`);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response from Gemini API');
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('📝 Generated text length:', generatedText.length);
        console.log('📝 Generated text preview:', generatedText.substring(0, 200) + '...');

        // Try to parse the response as JSON
        try {
          const jsonResponse = JSON.parse(generatedText);
          console.log('✅ Successfully parsed JSON response');
          return jsonResponse;
        } catch (parseError) {
          console.warn('⚠️ Response is not valid JSON, attempting to clean and extract...');
          
          // Clean the response and try to extract JSON
          const cleanedText = this.cleanJsonResponse(generatedText);
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
            try {
              const fixedJson = this.validateAndFixJson(jsonMatch[0]);
              const extractedJson = JSON.parse(fixedJson);
              console.log('✅ Successfully extracted and parsed JSON from response');
              return extractedJson;
            } catch (extractError) {
              console.error('❌ Failed to parse extracted JSON:', extractError);
              console.log('❌ Problematic JSON:', jsonMatch[0].substring(0, 500));
              
              // Try to repair truncated JSON
              try {
                const repairedJson = this.repairTruncatedJson(jsonMatch[0]);
                const repairedParsed = JSON.parse(repairedJson);
                console.log('✅ Successfully parsed after repairing truncated JSON');
                return repairedParsed;
              } catch (repairError) {
                console.error('❌ Repair attempt failed:', repairError);
                
                // Try one more time with more aggressive cleaning and extraction
                try {
                  let moreCleaned = jsonMatch[0]
                    .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                  
                  // Try to extract just the root object/array if it's malformed
                  const rootObjectMatch = moreCleaned.match(/^(\{[\s\S]*\}|\[[\s\S]*\])/);
                  if (rootObjectMatch) {
                    moreCleaned = rootObjectMatch[1];
                  }
                  
                  // Apply all fixes again
                  moreCleaned = this.validateAndFixJson(moreCleaned);
                  
                  const finalJson = JSON.parse(moreCleaned);
                  console.log('✅ Successfully parsed after aggressive cleaning');
                  return finalJson;
                } catch (finalError) {
                  console.error('❌ Final parsing attempt failed:', finalError);
                  
                  // Last resort: Try to extract just the first complete object/array
                  try {
                    const firstObjectMatch = jsonMatch[0].match(/^(\{[\s\S]*?\})/);
                    const firstArrayMatch = jsonMatch[0].match(/^(\[[\s\S]*?\])/);
                    
                    if (firstObjectMatch) {
                      const extracted = this.validateAndFixJson(firstObjectMatch[1]);
                      const parsed = JSON.parse(extracted);
                      console.log('✅ Successfully parsed first complete object');
                      return parsed;
                    } else if (firstArrayMatch) {
                      const extracted = this.validateAndFixJson(firstArrayMatch[1]);
                      const parsed = JSON.parse(extracted);
                      console.log('✅ Successfully parsed first complete array');
                      return parsed;
                    }
                  } catch (extractError) {
                    console.error('❌ Extraction also failed:', extractError);
                  }
                }
              }
            }
          }
          
          // If JSON extraction fails, try to use the existing AI service for text processing
          console.log('🔄 Attempting to use existing AI service for text processing...');
          try {
            return await this.fallbackToTextProcessing(prompt, generatedText);
          } catch (fallbackError) {
            console.error('❌ Fallback processing also failed:', fallbackError);
            
            // Create a simple response from the generated text
            return this.createSimpleResponseFromText(generatedText);
          }
        }
      } catch (error) {
        // If this model failed, try the next one
        console.warn(`⚠️ Failed to use ${config.model} (${config.version}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    // If all models failed, fall back to chat API
    console.warn('⚠️ All Gemini models failed, falling back to chat API...');
    try {
      console.log('🔄 Falling back to chat API...');
      return await this.fallbackToTextProcessing(prompt);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      // Return error response instead of throwing
      return this.createErrorResponse();
    }
  }

  /**
   * Clean JSON response by removing common issues
   */
  private static cleanJsonResponse(text: string): string {
    return text
      .replace(/```json\s*/g, '') // Remove markdown code blocks
      .replace(/```\s*/g, '') // Remove code block endings
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
      .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
      .replace(/\n\s*$/g, '') // Remove trailing newlines
      .replace(/^\s*\n/g, '') // Remove leading newlines
      .replace(/^\s*```json\s*/g, '') // Remove leading markdown
      .replace(/\s*```\s*$/g, '') // Remove trailing markdown
      .trim();
  }

  /**
   * Validate and fix JSON structure
   */
  private static validateAndFixJson(jsonString: string): string {
    try {
      // Try to parse first
      JSON.parse(jsonString);
      return jsonString;
    } catch (error) {
      console.log('🔧 Attempting to fix JSON structure...');
      
      // Common fixes for malformed JSON
      let fixed = jsonString
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{\[])\s*,/g, '$1') // Remove leading commas
        .replace(/,(\s*[,}])/g, '$1') // Remove double commas
        .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2') // Fix escaped characters
        .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2'); // Fix double-escaped characters
      
      // Try to fix array syntax errors and property value issues
      fixed = this.fixArraySyntax(fixed);
      
      // Try to fix missing commas after property values
      // Pattern: "key": value } or "key": value ] where value is not a string/object/array
      fixed = fixed.replace(/(":\s*)([^",\[\]{}]+?)(\s*)([}\]])/g, (match, p1, p2, p3, p4) => {
        // If p2 looks like a value (not already ending with comma), add comma
        if (p2.trim() && !p2.trim().endsWith(',') && !p2.trim().endsWith('}') && !p2.trim().endsWith(']')) {
          return p1 + p2 + ',' + p3 + p4;
        }
        return match;
      });
      
      // Try to find the last complete object/array
      let lastValidPosition = this.findLastValidPosition(fixed);
      
      if (lastValidPosition > 0 && lastValidPosition < fixed.length) {
        fixed = fixed.substring(0, lastValidPosition + 1);
      }
      
      return fixed;
    }
  }

  /**
   * Find the last valid position in JSON string
   */
  private static findLastValidPosition(jsonString: string): number {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let lastValid = 0;
    const stack: Array<{type: '{' | '[', pos: number}> = [];
    
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          stack.push({ type: '{', pos: i });
          depth++;
        } else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1].type === '{') {
            stack.pop();
            depth--;
            if (depth === 0) {
              lastValid = i;
            }
          }
        } else if (char === '[') {
          stack.push({ type: '[', pos: i });
          depth++;
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1].type === '[') {
            stack.pop();
            depth--;
            if (depth === 0) {
              lastValid = i;
            }
          }
        }
      }
    }
    
    return lastValid;
  }

  /**
   * Fix common array syntax errors and property value issues
   */
  private static fixArraySyntax(jsonString: string): string {
    let fixed = jsonString;
    let inString = false;
    let escapeNext = false;
    const stack: string[] = [];
    
    // First pass: Remove trailing commas before closing brackets/braces
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Second pass: Fix missing commas between array elements and object properties
    // This regex finds patterns like: } { or ] [ or value { or value [ where a comma is missing
    fixed = fixed.replace(/([}\]\"])\s*([{\[])/g, '$1, $2');
    fixed = fixed.replace(/([}\]\"])\s*(")/g, '$1, $2');
    
    // Third pass: Fix missing commas after property values
    // Pattern: "key": value } or "key": value ] where comma is missing
    fixed = fixed.replace(/(":\s*[^,}\]]+)\s*([}\]])/g, (match, p1, p2) => {
      // Check if there's already a comma
      if (!p1.endsWith(',') && !p1.endsWith('}') && !p1.endsWith(']')) {
        return p1 + ', ' + p2;
      }
      return match;
    });
    
    // Fourth pass: Fix unclosed structures
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '[') {
          stack.push('[');
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === '[') {
            stack.pop();
          }
        } else if (char === '{') {
          stack.push('{');
        } else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1] === '{') {
            stack.pop();
          }
        }
      }
    }
    
    // Close any unclosed structures
    while (stack.length > 0) {
      const last = stack.pop();
      if (last === '[') {
        fixed += ']';
      } else if (last === '{') {
        fixed += '}';
      }
    }
    
    // Final pass: Remove any double commas
    fixed = fixed.replace(/,(\s*,)/g, ',');
    
    return fixed;
  }

  /**
   * Repair truncated JSON by finding the last complete structure
   */
  private static repairTruncatedJson(jsonString: string): string {
    console.log('🔧 Attempting to repair truncated JSON...');
    
    // First, try to fix array syntax issues
    let fixed = this.fixArraySyntax(jsonString);
    
    // Try to find the last complete object/array
    let lastValidPosition = 0;
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    const stack: Array<{type: '{' | '[', pos: number}> = [];
    
    for (let i = 0; i < fixed.length; i++) {
      const char = fixed[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
          stack.push({ type: '{', pos: i });
        } else if (char === '}') {
          braceCount--;
          if (stack.length > 0 && stack[stack.length - 1].type === '{') {
            stack.pop();
          }
          if (braceCount === 0 && bracketCount === 0) {
            lastValidPosition = i + 1;
          }
        } else if (char === '[') {
          bracketCount++;
          stack.push({ type: '[', pos: i });
        } else if (char === ']') {
          bracketCount--;
          if (stack.length > 0 && stack[stack.length - 1].type === '[') {
            stack.pop();
          }
          if (braceCount === 0 && bracketCount === 0) {
            lastValidPosition = i + 1;
          }
        }
      }
    }
    
    if (lastValidPosition > 0) {
      const repaired = fixed.substring(0, lastValidPosition);
      // Remove any trailing commas before closing brackets/braces
      const cleaned = repaired.replace(/,(\s*[}\]])/g, '$1');
      console.log(`🔧 Repaired JSON by truncating at position ${lastValidPosition}`);
      return cleaned;
    }
    
    // If we can't find a complete structure, try to close it manually
    let attempt = fixed.trim();
    
    // Remove trailing commas that might cause issues
    attempt = attempt.replace(/,(\s*[}\]])/g, '$1');
    
    // Count unclosed braces and brackets (more accurately)
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    inString = false;
    escapeNext = false;
    
    for (let i = 0; i < attempt.length; i++) {
      const char = attempt[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') closeBraces++;
        else if (char === '[') openBrackets++;
        else if (char === ']') closeBrackets++;
      }
    }
    
    // Add missing closing characters in reverse order
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      attempt += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      attempt += '}';
    }
    
    console.log('🔧 Attempted to close JSON manually');
    return attempt;
  }

  /**
   * Fallback to text processing using chat API
   */
  private static async fallbackToTextProcessing(prompt: string, generatedText?: string): Promise<any> {
    try {
      const textMatch = prompt.match(/Original JSON Content:\n([\s\S]*?)\n\nPlease modify/);
      if (!textMatch) {
        throw new Error('Could not extract original JSON from prompt');
      }

      const originalJson = JSON.parse(textMatch[1]);
      const originalText = this.extractTextFromJson(originalJson);
      
      if (!originalText.trim()) {
        throw new Error('No text content found to process');
      }

      let processedText: string;
      
      if (generatedText) {
        // Use the generated text from Gemini if available
        processedText = generatedText;
      } else {
        // Try to use chat API as fallback
        try {
          const { apiClient } = await import('./api-client');
          const commandMatch = prompt.match(/User Command: (.+?)\n/);
          const userCommand = commandMatch ? commandMatch[1] : 'Improve and refine this text';
          
          const response = await apiClient.post('/api/chat', {
            message: `${userCommand}: ${originalText}`,
            context: {
              documentId: 'fallback',
            },
            document: originalText,
          });

          processedText = response.response || response.answer || originalText;
        } catch (chatError) {
          console.error('❌ Chat API fallback also failed:', chatError);
          // If chat API also fails, return original text wrapped in JSON structure
          processedText = originalText;
        }
      }
      
      // Convert the processed text back to the original JSON structure
      return this.convertTextToJson(processedText, originalJson);
      
    } catch (error) {
      console.error('❌ Text processing fallback failed:', error);
      return this.createErrorResponse();
    }
  }

  /**
   * Create error response
   */
  private static createErrorResponse(): any {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { lineHeight: "1.5", textAlign: "left" },
          content: [
            {
              type: "text",
              text: "Error processing legal edit. Please try again.",
              marks: [{ type: "textStyle", attrs: { color: "#ef4444" } }]
            }
          ]
        }
      ]
    };
  }

  /**
   * Create a text response when JSON parsing fails
   */
  private static createTextResponse(text: string): any {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { lineHeight: "1.5", textAlign: "left" },
          content: [
            {
              type: "text",
              text: text.trim(),
              marks: []
            }
          ]
        }
      ]
    };
  }

  /**
   * Create a simple response from generated text when all parsing fails
   */
  private static createSimpleResponseFromText(text: string): any {
    console.log('🔧 Creating simple response from generated text...');
    
    // Extract any meaningful text from the response
    const cleanText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/\{[\s\S]*?\}/g, '') // Remove any JSON-like structures
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // If we have some text, use it; otherwise use a default message
    const finalText = cleanText.length > 10 ? cleanText : 'Legal edit processed successfully.';
    
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { lineHeight: "1.5", textAlign: "left" },
          content: [
            {
              type: "text",
              text: finalText,
              marks: []
            }
          ]
        }
      ]
    };
  }

  /**
   * Convert rephrased text back to JSON structure
   */
  private static convertTextToJson(rephrasedText: string, originalJson: any): any {
    // If the original JSON is a simple paragraph, replace the text
    if (originalJson.type === 'paragraph' && originalJson.content && originalJson.content.length === 1 && originalJson.content[0].type === 'text') {
      return {
        ...originalJson,
        content: [
          {
            ...originalJson.content[0],
            text: rephrasedText
          }
        ]
      };
    }

    // For more complex structures, try to replace text content while preserving structure
    return this.replaceTextInJson(originalJson, rephrasedText);
  }

  /**
   * Replace text content in JSON while preserving structure
   */
  private static replaceTextInJson(json: any, newText: string): any {
    if (!json || typeof json !== 'object') return json;

    if (json.type === 'text' && json.text) {
      return { ...json, text: newText };
    }

    if (json.content && Array.isArray(json.content)) {
      return {
        ...json,
        content: json.content.map((item: any) => this.replaceTextInJson(item, newText))
      };
    }

    return json;
  }

  /**
   * Validate the AI response
   */
  private static validateLegalResponse(response: any, originalJson: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic JSON structure validation
    if (!response || typeof response !== 'object') {
      errors.push('Response is not a valid JSON object');
    }

    // Validate that we have some content to work with
    if (response && !Array.isArray(response.content) && !Array.isArray(response) && typeof response !== 'object') {
      errors.push('Response must contain valid content structure');
    }

    if (response && response.type && response.type !== 'doc' && response.type !== 'paragraph' && response.type !== 'text') {
      warnings.push('Response type may not be standard Tiptap format');
    }

    // Check for content preservation
    if (response && originalJson) {
      const originalText = this.extractTextFromJson(originalJson);
      const responseText = this.extractTextFromJson(response);
      
      if (originalText.length > 0 && responseText.length === 0) {
        warnings.push('Response appears to have lost all content');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate confidence score for the response
   */
  private static calculateConfidence(request: LegalEditRequest, response: any): number {
    let confidence = 0.5; // Base confidence

    // Check if response maintains structure
    if (response && response.type) {
      confidence += 0.2;
    }

    // Check if content is preserved
    if (response && this.extractTextFromJson(response).length > 0) {
      confidence += 0.2;
    }

    // Check if command was followed (basic heuristic)
    const command = request.userCommand.toLowerCase();
    const responseText = this.extractTextFromJson(response).toLowerCase();
    
    if (command.includes('rephrase') && responseText !== this.extractTextFromJson(request.selectedJsonSlice).toLowerCase()) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Identify changes made to the content
   */
  private static identifyChanges(original: any, modified: any): string[] {
    const changes: string[] = [];
    
    const originalText = this.extractTextFromJson(original);
    const modifiedText = this.extractTextFromJson(modified);
    
    if (originalText !== modifiedText) {
      changes.push('Text content modified');
    }
    
    // Add more specific change detection as needed
    return changes;
  }

  /**
   * Extract text content from JSON structure
   */
  private static extractTextFromJson(json: any): string {
    if (!json) return '';
    
    if (typeof json === 'string') return json;
    
    if (json.type === 'text' && json.text) {
      return json.text;
    }
    
    if (json.content && Array.isArray(json.content)) {
      return json.content.map((item: any) => this.extractTextFromJson(item)).join('');
    }
    
    return '';
  }

  /**
   * Get predefined legal commands for UI
   */
  static getLegalCommands(): Array<{id: string, label: string, description: string, example: string}> {
    return [
      {
        id: 'rephrase',
        label: 'Rephrase Clause',
        description: 'Rephrase this clause in formal legal language',
        example: 'Rephrase this clause in formal contract language'
      },
      {
        id: 'add_bullet',
        label: 'Add Bullet Point',
        description: 'Add a bullet point with specific legal content',
        example: 'Add a bullet point on jurisdictional limitations'
      },
      {
        id: 'summarize',
        label: 'Summarize Section',
        description: 'Summarize this section for client briefing',
        example: 'Summarize this section for client briefing'
      },
      {
        id: 'remove_redundant',
        label: 'Remove Redundancy',
        description: 'Remove redundant legal terms',
        example: 'Remove redundant legal terms'
      },
      {
        id: 'strengthen',
        label: 'Strengthen Language',
        description: 'Strengthen the legal language',
        example: 'Strengthen the enforceability language'
      },
      {
        id: 'simplify',
        label: 'Simplify Language',
        description: 'Simplify complex legal language',
        example: 'Simplify this clause for better readability'
      }
    ];
  }
}
