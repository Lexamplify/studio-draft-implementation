# **App Name**: LegalEase AI

## Core Features:

- Navigation Panel: Left navigation panel for accessing Assistant and Vault pages.
- Assistant Tabs: Tabbed interface within the Assistant page to switch between Assist (chat) and Draft functionalities.
- AI Chat Assistant: Chat interface powered by Gemini 1.5 Flash for real-time legal assistance; stores and retrieves history from Firestore using chatService tool.
- Template Search: Draft template search using Xenova embeddings and RAG (retrieval-augmented generation) over Firestore template embeddings. Utilizes the templateSearch tool for suggesting relevant legal drafts.
- Vault: Centralized repository for case files, draft templates, and generated drafts with search and filtering capabilities.
- OnlyOffice Integration: Integration of OnlyOffice iframe for document preview and editing directly within the Vault.
- AI Suggest: OnlyOffice integrated 'AI Suggest' button that sends selected text to the chatService tool for citation suggestions or rephrasing, powered by Gemini 1.5 Flash.

## Style Guidelines:

- Primary color: Electric blue (#3B82F6) to convey professionalism and trustworthiness.
- Background color: Off-white (#F7FAFC) to provide a clean and focused workspace.
- Accent color: Violet (#8B5CF6) to highlight key actions and elements with a modern touch.
- Inter font family.
- Heroicons set
- Minimalist, centered layout to enhance focus on core content and actions.