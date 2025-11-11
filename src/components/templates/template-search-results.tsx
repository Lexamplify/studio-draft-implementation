"use client";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SearchResult } from "@/lib/template-search-service";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { processTemplateContentForFirestore } from "@/lib/template-processor";
import { fetchTemplateFromFirebase } from "@/lib/firebase-template-service";
import { TemplateCustomizationModal } from "./template-customization-modal";
import { TemplateAIService } from "@/lib/template-ai-service";

interface TemplateSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onClearSearch: () => void;
  onTemplateSelect: (template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  }) => Promise<void>;
}

export const TemplateSearchResults = ({ 
  results, 
  isLoading, 
  onClearSearch,
  onTemplateSelect 
}: TemplateSearchResultsProps) => {
  const [isCreating, setIsCreating] = useState(false);

  // Template customization modal state
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const onTemplateClick = async (template: SearchResult) => {
    try {
      let initialContent = `<h1>${template.name}</h1><p>${template.description}</p>`;
      
      // Fetch template content from Firebase using the template ID
      try {
        const firebaseTemplate = await fetchTemplateFromFirebase(template.id);
        
        if (firebaseTemplate) {
          // Use the content from Firebase template
          const templateContent = firebaseTemplate.initialContent || firebaseTemplate.content;
          
          if (templateContent) {
            // Check if the content is JSON (TipTap format) or HTML
            try {
              const jsonContent = JSON.parse(templateContent);
              if (jsonContent.type === 'doc' && Array.isArray(jsonContent.content)) {
                // It's a valid TipTap JSON document
                initialContent = templateContent;
                console.log("✅ Using TipTap JSON content from Firebase");
              } else {
                // It's JSON but not TipTap format, treat as string
                initialContent = templateContent;
                console.log("✅ Using JSON content from Firebase");
              }
            } catch {
              // Not JSON, treat as HTML
              initialContent = templateContent;
              console.log("✅ Using HTML content from Firebase");
            }
          } else {
            console.warn("No content found in Firebase template, using default content");
          }
        } else {
          console.warn("Template not found in Firebase, using default content");
        }
      } catch (firebaseError) {
        console.warn("Failed to fetch template from Firebase:", firebaseError);
        // Continue with default content
      }

      // Create template object for modal
      const templateForModal = {
        id: template.id,
        label: template.name,
        imageUrl: "/blank-document.svg", // Default image since SearchResult doesn't have imageUrl
        initialContent: initialContent,
        queries: [] // Default empty queries since SearchResult doesn't have queries
      };

      setSelectedTemplate(templateForModal);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error preparing template:", error);
      toast.error("Something went wrong");
    }
  };

  const handleSkipTemplate = async (template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  }) => {
    setIsCreating(true);
    
    try {
      // Process the template content to handle JSON format for Firestore storage
      const processedContent = processTemplateContentForFirestore(
        typeof template.initialContent === 'string' ? template.initialContent : JSON.stringify(template.initialContent)
      );
      
      // Ensure we always pass a string to Firestore
      const contentForFirestore = typeof processedContent === 'string' ? processedContent : JSON.stringify(processedContent);
      
      await onTemplateSelect({
        ...template,
        initialContent: contentForFirestore
      });
      
      toast.success("Document created");
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCustomizeTemplate = async (template: {
    id: string;
    label: string;
    imageUrl: string;
    initialContent: string | object;
    queries?: string[];
  }, answers: Record<string, string>) => {
    setIsCustomizing(true);
    
    try {
      console.log('🎨 Customizing template with answers:', answers);
      
      // Use AI service to customize the template
      const customizationResult = await TemplateAIService.customizeTemplate({
        templateContent: template.initialContent,
        queries: template.queries || [],
        answers,
        templateType: template.label
      });

      if (!customizationResult.success) {
        throw new Error(customizationResult.error || 'Failed to customize template');
      }

      // Process the customized content
      const processedContent = processTemplateContentForFirestore(
        typeof customizationResult.customizedContent === 'string' ? customizationResult.customizedContent : JSON.stringify(customizationResult.customizedContent)
      );
      const contentForFirestore = typeof processedContent === 'string' ? processedContent : JSON.stringify(processedContent);
      
      await onTemplateSelect({
        ...template,
        label: `${template.label} (Customized)`,
        initialContent: contentForFirestore
      });
      
      toast.success("Customized document created");
    } catch (error) {
      console.error("Error customizing template:", error);
      toast.error("Failed to customize template. Please try again.");
    } finally {
      setIsCustomizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#F1F3F4]">
        <div className="max-w-screen-xl mx-auto px-16 py-6 flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Search Results</h3>
            <button
              onClick={onClearSearch}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear Search
            </button>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Searching templates...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-[#F1F3F4]">
        <div className="max-w-screen-xl mx-auto px-16 py-6 flex flex-col gap-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Search Results</h3>
            <button
              onClick={onClearSearch}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear Search
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm">Try different search terms or clear the search to see all templates.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F1F3F4]">
      <div className="max-w-screen-xl mx-auto px-16 py-6 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Search Results ({results.length} found)</h3>
          <button
            onClick={onClearSearch}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear Search
          </button>
        </div>
        <Carousel>
          <CarouselContent className="-ml-4">
            {results.map((template) => (
              <CarouselItem
                key={template.id}
                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-[14.285714%] pl-4"
              >
                <div
                  className={cn(
                    "aspect-[3/4] flex flex-col gap-y-2.5",
                    (isCreating || isCustomizing) && "pointer-events-none opacity-50"
                  )}
                >
                  <button
                    disabled={isCreating || isCustomizing}
                    onClick={() => onTemplateClick(template)}
                    className="size-full hover:border-blue-500 rounded-sm border hover:bg-blue-50 transition flex flex-col items-center justify-center gap-y-4 bg-white p-4 relative"
                  >
                    {(isCreating || isCustomizing) && (
                      <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-y-2 rounded-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                          {isCreating ? "Creating..." : "Customizing..."}
                        </span>
                      </div>
                    )}
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-1">{template.description}</p>
                    </div>
                  </button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Template Customization Modal */}
      {selectedTemplate && (
        <TemplateCustomizationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTemplate(null);
          }}
          template={selectedTemplate}
          onSkip={handleSkipTemplate}
          onCustomize={handleCustomizeTemplate}
          isProcessing={isCreating || isCustomizing}
        />
      )}
    </div>
  );
};

