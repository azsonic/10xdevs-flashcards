# OpenRouter Service Implementation Guide

## 1) Service description

OpenRouterService is a TypeScript helper that wraps OpenRouter’s chat completions for both one-shot and streaming conversations. It normalizes message construction (system/user), structured `response_format` JSON schema support, model/parameter selection, error handling, logging, and security hygiene for use across Astro/React server utilities (e.g., `src/lib/openrouterService.ts`).

### Key components and purposes (numbered)

1. Config & credentials loader — resolve base URL, API key, org/router headers, defaults.
2. HTTP client wrapper — fetch-based POST with timeout, retries, backoff, and abort support.
3. Message builder — assembles system/user messages and optional assistant/context messages into OpenRouter schema.
4. Response-format builder — injects JSON schema `response_format` payload when structured outputs are needed.
5. Model & parameter selector — validates and applies model name plus tunable params (temperature, max_tokens, top_p, etc.).
6. Streaming handler — manages `stream: true` requests, SSE parsing, incremental token delivery, and final assembly.
7. Response normalizer — extracts text / JSON payloads, validates against schema when present, and returns typed results.
8. Error mapper — converts HTTP/network/model errors into typed domain errors with actionable messages.
9. Observability hooks — minimal logging/tracing hooks for success/failure/latency; redacts secrets.
10. Safety & quota guards — token budgeting, length checks, and pre-flight validations to avoid overuse or malformed calls.

## 2) Constructor description

- Inputs: config object with `apiKey` (required), `baseUrl` (default `https://openrouter.ai/api/v1`), `defaultModel`, `timeoutMs`, `maxRetries`, `retryBackoffMs`, optional `headers` (e.g., `HTTP-Referer`, `X-Title`), and optional logger interface.
- Actions: store config, prebuild a base `Headers` instance (excluding secrets from logs), initialize fetch/AbortController utilities, and optionally accept a schema validator (e.g., `ajv`) for response validation.

## 3) Public methods and fields

- `chat(options): Promise<ChatResult>` — non-streaming call; builds messages, applies model/params/schema, executes request, normalizes response, and validates structured output when provided.
- `chatStream(options): AsyncGenerator<ChatChunk>` — streaming call; same inputs as `chat` plus onToken/onDone callbacks; yields deltas and final aggregated result.
- `setDefaultModel(model: string)` — update default model at runtime with validation.
- `withDefaults(partialConfig): OpenRouterService` — returns a scoped instance with merged config (helpful per-request overrides).
- `buildResponseFormat(schemaName: string, schema: object): ResponseFormat` — helper to construct a compliant response_format object.
- Types: exported `ChatMessage`, `ChatOptions`, `ModelParams`, `ResponseFormat`, `ChatResult`, `ChatChunk`, `OpenRouterError`.

### Message element examples (align to OpenRouter expectations)

1. **System message** example
   ```ts
   { role: "system", content: "You are a terse assistant. Reply in markdown." }
   ```
2. **User message** example
   ```ts
   { role: "user", content: "Summarize the following transcript in 3 bullets." }
   ```
3. **Structured response via response_format** example (strict JSON schema)
   ```ts
   const response_format = {
     type: "json_schema",
     json_schema: {
       name: "summary_payload",
       strict: true,
       schema: {
         type: "object",
         required: ["bullets"],
         properties: {
           bullets: { type: "array", minItems: 1, items: { type: "string" } },
         },
         additionalProperties: false,
       },
     },
   };
   ```
4. **Model name** example  
   `options.model = "openrouter/anthropic/claude-3.5-sonnet"`
5. **Model parameters** example
   ```ts
   options.params = { temperature: 0.2, max_tokens: 512, top_p: 0.9, presence_penalty: 0 };
   ```

## 4) Private methods and fields

- `_buildHeaders(extra?: Record<string, string>): Headers` — merges defaults and request-specific headers; always sets `Authorization: Bearer <key>` when key is present.
- `_buildPayload(options): OpenRouterPayload` — constructs body with `model`, `messages`, optional `response_format`, optional `stream`, and `...params`; validates required pieces.
- `_execute(payload, { stream }): Response | ReadableStream` — performs fetch with timeout/AbortController, retry/backoff logic on retryable errors.
- `_parseStream(stream): AsyncGenerator<ChatChunk>` — consumes SSE/NDJSON chunks, yielding token deltas and final message.
- `_normalizeResponse(json): ChatResult` — extracts content; if `response_format` was set, parses/validates JSON string into typed object.
- `_validateOptions(options)` — guards model presence, message non-empty, and schema shape when provided.
- Fields: `_config`, `_baseHeaders`, optional `_logger`, optional `_schemaValidator`.

## 5) Error handling

### Potential error scenarios (numbered)

1. Missing/invalid API key or base URL.
2. Network failures or timeouts.
3. HTTP errors (401/403 unauthorized, 404 model, 429 rate limit, 5xx upstream).
4. Malformed request payload (bad schema, empty messages, invalid params).
5. Stream aborted mid-flight.
6. Model refusal/safety block or tool-call errors in response.
7. Structured output parse/validation failure against JSON schema.

### Handling approach

- Map each scenario to `OpenRouterError` with `type`, `status`, `message`, `cause`, and `retryAfter` (when present).
- Apply exponential backoff retries for (2) and (3: 429/5xx) only; no retry for auth/validation.
- Timeouts: AbortController; surface timeout-specific error type.
- Validation: fail fast before network call; detailed messages for missing fields.
- Streaming: propagate aborts; attempt graceful close; emit partial data when safe.
- Schema validation: when `response_format` present, parse JSON and validate; on failure, return typed validation error with raw text preserved.

## 6) Security considerations

- Never log API keys or full payloads; redact secrets in logs.
- Keep API key outside client bundles (use server-side config/env only).
- Enforce size limits on user content to avoid excessive token usage.
- Validate/whitelist model names if restricting to approved models.
- Use HTTPS-only endpoints; set sane timeouts to prevent hanging connections.
- Handle `response_format` safely: reject schemas with `additionalProperties: true` if strictness is required.
- Avoid reflecting raw model errors back to end users; provide friendly messages.

## 7) Step-by-step implementation plan (TypeScript-focused)

1. **Create service file** `src/lib/openrouterService.ts`; export class `OpenRouterService` and supporting types.
2. **Define types** for `ChatMessage`, `ChatOptions`, `ModelParams`, `ResponseFormat`, `ChatResult`, `ChatChunk`, `OpenRouterError`.
3. **Implement constructor** to store config, create `_baseHeaders`, and accept optional logger/schema validator.
4. **Add `_validateOptions`** to assert API key/model/messages/params/schema sanity with clear error messages.
5. **Add `_buildHeaders`** merging defaults and per-call headers; ensure `Authorization` is set.
6. **Add `_buildPayload`** assembling `model`, `messages`, optional `response_format`, `stream`, and `...params`; strip undefined values.
7. **Implement `_execute`** using `fetch` with timeout+AbortController; include retry/backoff for transient errors; map errors via `_mapError`.
8. **Implement `_parseStream`** to consume SSE/NDJSON tokens; yield `{ delta, done }`; accumulate final message for return.
9. **Implement `_normalizeResponse`** for non-stream: parse JSON, extract `choices[0].message.content`; if `response_format` used, parse content as JSON and validate via optional validator; return typed `ChatResult`.
10. **Public `chat`**: validate options → build payload → execute non-stream → normalize → return result.
11. **Public `chatStream`**: validate options → build payload with `stream: true` → execute stream → yield chunks; surface abort handling.
12. **Helper `buildResponseFormat`**: create `{ type: "json_schema", json_schema: { name, strict: true, schema } }` and validate schema shape.
13. **Add observability hooks**: small logger interface (`debug/info/warn/error`); log request metadata (model, latency, retry count) without secrets.
14. **Add safety guards**: optional token estimate (model-dependent), max input length, and model whitelist configuration.
15. **Write usage examples** in JSDoc: system/user messages, structured response example (as above), and model params usage.
