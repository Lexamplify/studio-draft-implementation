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
  private static readonly GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ;
  private static readonly GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/AIzaSyAECbWYM3dL9AEoWPfethazjVJDjVHeUu4-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;

  /**
   * Customize a template based on user answers
   */
  static async customizeTemplate(request: TemplateCustomizationRequest): Promise<TemplateCustomizationResponse> {
    try {
      console.log('🤖 Starting template customization with Gemini...', {
        templateType: request.templateType,
        queriesCount: request.queries.length,
        answersCount: Object.keys(request.answers).length
      });

      // Build the prompt for template customization
      const prompt = this.buildCustomizationPrompt(request);
      
      // Call Gemini API
      const response = await fetch(this.GEMINI_API_URL, {
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

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('📝 Generated customization text length:', generatedText.length);

      // Parse the response
      const customizedContent = this.parseCustomizedContent(generatedText, request.templateContent);

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
      // Try to extract JSON if the original content was JSON
      if (typeof originalContent === 'object' || (typeof originalContent === 'string' && originalContent.trim().startsWith('{'))) {
        // Look for JSON in the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsedJson = JSON.parse(jsonMatch[0]);
            console.log('✅ Successfully parsed customized JSON content');
            return parsedJson;
          } catch (parseError) {
            console.warn('⚠️ Failed to parse JSON from response, using original content');
            return originalContent;
          }
        }
      }

      // For HTML or text content, clean and return
      const cleanedText = generatedText
        .replace(/```html\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/```json\s*/g, '')
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
      // If original was JSON, check if customized is also valid JSON
      if (typeof original === 'object' || (typeof original === 'string' && original.trim().startsWith('{'))) {
        if (typeof customized === 'object') {
          return true; // Both are objects
        }
        if (typeof customized === 'string') {
          try {
            JSON.parse(customized);
            return true; // Customized is valid JSON string
          } catch {
            return false; // Customized is not valid JSON
          }
        }
      }

      // For HTML/text content, just check if we have content
      return typeof customized === 'string' && customized.trim().length > 0;

    } catch (error) {
      console.error('❌ Error validating customized content:', error);
      return false;
    }
  }
}

