# Deepseek AI Integration

This document describes the Deepseek AI integration in the AuraMind application.

## Overview

The Deepseek integration allows users to chat with the Deepseek AI model through the OpenRouter API. This provides an additional AI assistant feature alongside the existing Gemini-powered flashcard generation.

## Files Added/Modified

### 1. `services/deepseekService.ts`
- **Purpose**: Core service for interacting with the Deepseek API
- **Features**:
  - Simple Q&A interface
  - Advanced chat completion with full control
  - Streaming support for real-time responses
  - TypeScript type definitions
  - Error handling and logging

### 2. `components/DeepseekChat.tsx`
- **Purpose**: React component for the chat interface
- **Features**:
  - Clean chat UI with message history
  - Loading states and error handling
  - Responsive design
  - Keyboard shortcuts (Enter to send)
  - Back navigation

### 3. Modified Files
- `types.ts`: Added `DEEPSEEK_CHAT` to ViewState enum
- `App.tsx`: 
  - Added Deepseek chat view routing
  - Added AI Chat button to Dashboard
  - Integrated navigation between views

## Usage

### Accessing the Chat
1. Navigate to the Dashboard
2. Click the "AI Chat" button (purple button with Bot icon)
3. Start chatting with Deepseek AI

### API Configuration
The API key is configured via environment variables. Create a `.env` file in the project root:
```env
VITE_OPENROUTER_API_KEY=your_key_here
```
The service will automatically load this key.

### Example Usage in Code
```typescript
import { deepseekClient } from './services/deepseekService';

// Simple Q&A
const answer = await deepseekClient.ask('What is the meaning of life?');

// Advanced usage
const response = await deepseekClient.chatCompletion({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Tell me a joke' }
  ],
  temperature: 0.7
});
```

## API Details

### Endpoint
- Base URL: `https://openrouter.ai/api/v1`
- Model: `deepseek/deepseek-r1-0528:free`

### Authentication
- Bearer token authentication
- API key provided by OpenRouter

### Headers
```typescript
{
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': window.location.href,
  'X-Title': document.title
}
```

## Features

### 1. Type Safety
Full TypeScript support with proper type definitions for all API responses and requests.

### 2. Error Handling
Comprehensive error handling for:
- Network errors
- API errors
- Invalid responses
- Missing API key

### 3. Streaming Support
Optional streaming support for real-time chat responses (not currently used in UI but available).

### 5. Advanced Tools
   - **`explain_concept`**: Detailed explanations with examples and key points.
   - **`generate_quiz`**: Create interactive quizzes.
   - **`generate_flashcards`**: Create study decks.
   - **`generate_presentation`**: Create AI-narrated slideshows.

### 6. Data Source Integration
   - **Topic**: Generate from simple text topics.
   - **PDF**: Extract text from uploaded PDF files (via `pdfjs-dist`).
   - **YouTube/Web**: Process URLs for content generation.

## Security Considerations

1. **API Key**: Configured via `VITE_OPENROUTER_API_KEY` in `.env`.
   - **Status**: Secure (Not hardcoded).
   - **Validation**: Service checks for key existence before requests.

2. **CORS**: Ensure OpenRouter API allows requests from your domain

3. **Rate Limits**: Be aware of OpenRouter's rate limits

## Future Enhancements

1. **Environment Variables**: Move API key to `.env` file
2. **Model Selection**: Allow users to choose different Deepseek models
3. **Conversation History**: Persist chat history across sessions
4. **Custom System Prompts**: Allow users to set custom system prompts
5. **Voice Input**: Integrate with existing speech-to-text functionality
6. **Export Chat**: Allow users to export chat conversations

## Troubleshooting

### Common Issues

1. **"API key is required" error**
   - Ensure the API key is correctly set
   - Check if the key is valid and active

2. **Network errors**
   - Check internet connection
   - Verify CORS settings
   - Check if OpenRouter API is accessible

3. **"No response from model"**
   - Check if the model is available
   - Verify the request format
   - Check API quotas

### Debug Mode
To enable debug logging, check the browser console for API request/response details.

## Dependencies

- Built-in `fetch` API (no additional dependencies required)
- React hooks for state management
- Lucide React icons (for UI components)

## License

This integration follows the same license as the AuraMind application.
