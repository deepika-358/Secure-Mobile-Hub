---
name: OpenAI lazy initialization
description: OpenAI client must be created lazily (inside the function), not at module scope, so the server starts even when OPENAI_API_KEY is missing.
---

**Rule:** Never do `const client = new OpenAI({ apiKey: ... })` at the top level of a module.

**Why:** Node ESM evaluates module-level code at import time. If the env var is missing, the OpenAI constructor throws and crashes the entire process before any route can respond with a helpful error.

**How to apply:**

```typescript
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

export async function detectFakeNews(...) {
  const client = getClient(); // only called at request time
  ...
}
```

This way the server boots normally and only individual API calls fail gracefully when the key is absent.
