// Template search service for Firestore integration
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface TemplateSearchResponse {
  results: SearchResult[];
}

// Production API URL for template search
const SEARCH_TEMPLATES_API_URL = process.env.NODE_ENV === 'production'
  ? 'http://127.0.0.1:8000/api/search-templates'
  : 'http://127.0.0.1:8000/api/search-templates';

export class TemplateSearchService {
  static async searchTemplates(query: string): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const res = await fetch(SEARCH_TEMPLATES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Search API error: ${res.status}`);
      }

      const data: TemplateSearchResponse = await res.json();
      console.log("🔍 Template Search Response:", data);
      
      return (data.results || []).map((item: any, index: number) => ({
        id: item.id || `${Date.now()}-${index}`,
        name: item.fileName || item.name || "Untitled Document.docx",
        description: item.description || `Legal template: ${item.fileName || item.name || 'Unknown'}`,
        url: item.storageUrl || item.url || '',
      }));
    } catch (error) {
      console.error("Error searching templates:", error);
      throw new Error("Failed to search for templates. Please try again.");
    }
  }
}

