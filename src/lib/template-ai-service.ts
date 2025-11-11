/**
 * Template AI Service for Customizing Templates with Gemini
 * 
 * This service handles AI-powered template customization using Gemini API
 * to modify template content based on user answers to queries.
 */

export interface TemplateCustomizationRequest {
  templateContent: string | object;
  queries: string[];
  answers: Record<string, string>;
  templateType?: string;
}

export interface TemplateCustomizationResponse {
  customizedContent: string | object;
  success: boolean;
  error?: string;
}

export class TemplateAIService {
  private static readonly GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  private static readonly MAX_CONTENT_SIZE = 1000000; // 1MB limit for template content

  private static getGeminiApiUrl(): string {
    if (!this.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.');
    }
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
  }

  /**
   * Customize a template based on user answers
   */
  static async customizeTemplate(request: TemplateCustomizationRequest): Promise<TemplateCustomizationResponse> {
    try {
      // Validate API key
      if (!this.GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      // Validate content size
      const contentSize = typeof request.templateContent === 'string' 
        ? request.templateContent.length 
        : JSON.stringify(request.templateContent).length;
      
      if (contentSize > this.MAX_CONTENT_SIZE) {
        throw new Error(`Template content is too large (${contentSize} bytes). Maximum size is ${this.MAX_CONTENT_SIZE} bytes.`);
      }

      console.log('🤖 Starting template customization with Gemini...', {
        templateType: request.templateType,
        queriesCount: request.queries.length,
        answersCount: Object.keys(request.answers).length,
        contentSize
      });

      // Build the prompt for template customization
      const prompt = this.buildCustomizationPrompt(request);
      
      // Call Gemini API
      const response = await fetch(this.getGeminiApiUrl(), {
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
            temperature: 0.3, // Lower temperature for more consistent results
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
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
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');

      // Check for API errors in response
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      if (!data.candidates || !data.candidates[0]) {
        throw new Error('No candidates in Gemini API response');
      }

      const candidate = data.candidates[0];
      
      // Check if content was blocked
      if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
        const safetyRatings = candidate.safetyRatings || [];
        const blockedReasons = safetyRatings
          .filter((rating: any) => rating.probability === 'HIGH' || rating.probability === 'MEDIUM')
          .map((rating: any) => rating.category);
        throw new Error(`Content was blocked by safety filters. Reasons: ${blockedReasons.join(', ')}`);
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response from Gemini API: no content parts found');
      }

      // Combine all text parts (in case there are multiple)
      const generatedText = candidate.content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('');

      if (!generatedText || generatedText.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      console.log('📝 Generated customization text length:', generatedText.length);

      // Parse the response
      const customizedContent = this.parseCustomizedContent(generatedText, request.templateContent);

      // Validate the customized content
      if (!this.validateCustomizedContent(request.templateContent, customizedContent)) {
        console.warn('⚠️ Customized content validation failed, but proceeding with result');
      }

      return {
        customizedContent,
        success: true
      };

    } catch (error) {
      console.error('❌ Error customizing template:', error);
      return {
        customizedContent: request.templateContent, // Fallback to original content
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Build the prompt for template customization
   */
  private static buildCustomizationPrompt(request: TemplateCustomizationRequest): string {
    const { templateContent, queries, answers, templateType } = request;
    
    let prompt = `You are an AI assistant that customizes document templates based on user input. Your task is to modify the provided template content according to the user's answers to specific questions.

TEMPLATE TYPE: ${templateType || 'General Document'}

ORIGINAL TEMPLATE CONTENT:
${typeof templateContent === 'string' ? templateContent : JSON.stringify(templateContent, null, 2)}

CUSTOMIZATION QUESTIONS AND ANSWERS:
`;

    queries.forEach((query, index) => {
      const answer = answers[query] || '';
      prompt += `${index + 1}. ${query}\n   Answer: ${answer}\n\n`;
    });

    prompt += `
INSTRUCTIONS:
1. Modify the template content to incorporate the user's answers naturally
2. Replace placeholder text, generic information, or template variables with the provided answers
3. Maintain the original structure, formatting, and style of the document
4. If the template is in JSON format (TipTap/ProseMirror), preserve the JSON structure exactly
5. If the template is in HTML format, preserve the HTML structure and styling
6. Make the content feel personalized and specific to the user's input
7. Ensure the final result is professional and well-formatted

IMPORTANT FOR JSON TEMPLATES:
- Preserve all JSON structure, attributes, and formatting
- Only modify text content within the JSON
- Keep all styling, alignment, and formatting attributes intact
- Return the complete JSON object

IMPORTANT FOR HTML TEMPLATES:
- Preserve all HTML tags and structure
- Only modify text content and placeholder values
- Keep all CSS classes and styling intact
- Return complete HTML

Please customize the template now:`;

    return prompt;
  }

  /**
   * Parse the customized content from Gemini's response
   */
  private static parseCustomizedContent(generatedText: string, originalContent: string | object): string | object {
    try {
      const isOriginalJson = typeof originalContent === 'object' || 
        (typeof originalContent === 'string' && 
         (originalContent.trim().startsWith('{') || originalContent.trim().startsWith('[')));

      if (isOriginalJson) {
        // Try to extract JSON from the response (handles both objects and arrays)
        // First, try to find JSON wrapped in code blocks
        const codeBlockMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            const parsedJson = JSON.parse(codeBlockMatch[1].trim());
            console.log('✅ Successfully parsed customized JSON content from code block');
            return parsedJson;
          } catch (parseError) {
            console.warn('⚠️ Failed to parse JSON from code block, trying other methods');
          }
        }

        // Try to find JSON object or array in the response
        // Use a more precise approach: find the first { or [ and try to parse from there
        let jsonStart = -1;
        let jsonEnd = -1;
        let braceCount = 0;
        let bracketCount = 0;

        // Find the start of JSON (first { or [)
        for (let i = 0; i < generatedText.length; i++) {
          if (generatedText[i] === '{' || generatedText[i] === '[') {
            jsonStart = i;
            braceCount = generatedText[i] === '{' ? 1 : 0;
            bracketCount = generatedText[i] === '[' ? 1 : 0;
            break;
          }
        }

        if (jsonStart >= 0) {
          // Find the matching closing brace/bracket
          for (let i = jsonStart + 1; i < generatedText.length; i++) {
            if (generatedText[i] === '{') braceCount++;
            if (generatedText[i] === '}') braceCount--;
            if (generatedText[i] === '[') bracketCount++;
            if (generatedText[i] === ']') bracketCount--;
            
            if (braceCount === 0 && bracketCount === 0) {
              jsonEnd = i + 1;
              break;
            }
          }

          if (jsonEnd > jsonStart) {
            try {
              const jsonString = generatedText.substring(jsonStart, jsonEnd);
              const parsedJson = JSON.parse(jsonString);
              console.log('✅ Successfully parsed customized JSON content');
              return parsedJson;
            } catch (parseError) {
              console.warn('⚠️ Failed to parse extracted JSON, trying fallback');
            }
          }
        }

        // Fallback: try parsing the entire cleaned text
        const cleanedText = generatedText
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        try {
          const parsedJson = JSON.parse(cleanedText);
          console.log('✅ Successfully parsed customized JSON content from cleaned text');
          return parsedJson;
        } catch (parseError) {
          console.warn('⚠️ Failed to parse JSON from response, using original content');
          return originalContent;
        }
      }

      // For HTML or text content, clean and return
      const cleanedText = generatedText
        .replace(/```html\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/```json\s*/gi, '')
        .trim();

      console.log('✅ Using cleaned text content');
      return cleanedText;

    } catch (error) {
      console.error('❌ Error parsing customized content:', error);
      return originalContent;
    }
  }

  /**
   * Validate that the customized content maintains the original structure
   */
  private static validateCustomizedContent(original: string | object, customized: string | object): boolean {
    try {
      const isOriginalJson = typeof original === 'object' || 
        (typeof original === 'string' && 
         (original.trim().startsWith('{') || original.trim().startsWith('[')));

      // If original was JSON, check if customized is also valid JSON
      if (isOriginalJson) {
        if (typeof customized === 'object') {
          // Both are objects/arrays - basic type check
          return Array.isArray(original) === Array.isArray(customized);
        }
        if (typeof customized === 'string') {
          try {
            const parsed = JSON.parse(customized);
            // Check if both are arrays or both are objects
            const originalIsArray = Array.isArray(original) || 
              (typeof original === 'string' && original.trim().startsWith('['));
            const parsedIsArray = Array.isArray(parsed);
            return originalIsArray === parsedIsArray;
          } catch {
            return false; // Customized is not valid JSON
          }
        }
        return false; // Original is JSON but customized is neither object nor string
      }

      // For HTML/text content, just check if we have content
      return typeof customized === 'string' && customized.trim().length > 0;

    } catch (error) {
      console.error('❌ Error validating customized content:', error);
      return false;
    }
  }
}

