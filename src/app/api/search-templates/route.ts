import { NextRequest, NextResponse } from 'next/server';

// Mock data for testing - replace with your actual Firestore integration
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Legal Contract Template',
    description: 'A comprehensive legal contract template for business agreements',
    storageUrl: 'https://example.com/templates/legal-contract.json'
  },
  {
    id: 'template-2', 
    name: 'Non-Disclosure Agreement',
    description: 'Standard NDA template for protecting confidential information',
    storageUrl: 'https://example.com/templates/nda.json'
  },
  {
    id: 'template-3',
    name: 'Employment Contract',
    description: 'Professional employment contract template',
    storageUrl: 'https://example.com/templates/employment.json'
  },
  {
    id: 'template-4',
    name: 'Software License Agreement',
    description: 'Template for software licensing and distribution agreements',
    storageUrl: 'https://example.com/templates/software-license.json'
  },
  {
    id: 'template-5',
    name: 'Partnership Agreement',
    description: 'Business partnership agreement template',
    storageUrl: 'https://example.com/templates/partnership.json'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Simple search logic - in production, replace with Firestore query
    const searchResults = mockTemplates.filter(template =>
      template.name.toLowerCase().includes(query.toLowerCase()) ||
      template.description.toLowerCase().includes(query.toLowerCase())
    );

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      results: searchResults.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        storageUrl: template.storageUrl
      }))
    });

  } catch (error) {
    console.error('Search templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
