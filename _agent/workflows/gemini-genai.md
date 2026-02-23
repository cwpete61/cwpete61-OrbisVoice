---
description: Integrated the @google/genai SDK for Gemini AI agents
---

# Workflow: Using @google/genai SDK

This workflow describes how to integrate and use the modern `@google/genai` SDK in the project.

## 1. Installation
Install the SDK in your package:
```bash
npm install @google/genai
```

## 2. Basic Configuration
Initialize the client using an API Key (Gemini Developer API) or Vertex AI.

```typescript
import { createClient } from "@google/genai";

const client = createClient({
  apiKey: process.env.GEMINI_API_KEY,
});
```

## 3. Text Generation
```typescript
const response = await client.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [{ role: "user", parts: [{ text: "Hello!" }] }],
});

console.log(response.text());
```

## 4. Multimodal Generation (Audio/Video)
The SDK simplifies sending multimodal data:

```typescript
const response = await client.models.generateContent({
  model: "gemini-2.0-flash",
  contents: [
    {
      role: "user",
      parts: [
        { inline_data: { mime_type: "audio/pcm", data: base64Audio } },
        { text: "Transcribe this audio." }
      ]
    }
  ]
});
```

## 5. Tool Use (Function Calling)
Define tools and pass them to the model:

```typescript
const tools = [
  {
    function_declarations: [
      {
        name: "get_weather",
        description: "Get the weather in a given location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" }
          }
        }
      }
    ]
  }
];

const response = await client.models.generateContent({
  model: "gemini-2.0-flash",
  tools,
  contents: [{ role: "user", parts: [{ text: "What is the weather in London?" }] }],
});
```

## 6. Vertex AI Integration
To use Vertex AI instead of the Developer API, change the config:

```typescript
const client = createClient({
  project: "my-gcp-project",
  location: "us-central1",
});
```

## Best Practices
- **Environment Variables**: Always use `env.ts` to manage API keys.
- **Error Handling**: Use `try/catch` and log errors via the project's `logger`.
- **Model Versions**: Default to `gemini-2.0-flash` for the best balance of speed and capability.
