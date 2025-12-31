import type {
  ChatMessage,
  ChatOptions,
  ChatChunk,
  ChatResult,
  OpenRouterConfig,
  OpenRouterResolvedConfig,
  OpenRouterErrorType,
  OpenRouterLogger,
  ResponseFormat,
} from "./openrouter.types";

export type {
  ChatMessage,
  ChatOptions,
  ChatChunk,
  ChatResult,
  ModelParams,
  OpenRouterConfig,
  ResponseFormat,
} from "./openrouter.types";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BACKOFF_MS = 1000;

/**
 * OpenRouterService wraps OpenRouter chat completions for one-shot and streaming use.
 *
 * Text example:
 * const svc = new OpenRouterService({ apiKey: process.env.OPENROUTER_API_KEY!, defaultModel: "gpt-4o-mini" });
 * const result = await svc.chat({ messages: [{ role: "user", content: "Ping" }] });
 * console.log(result.content);
 *
 * Structured JSON example:
 * const response_format = svc.buildResponseFormat("summary_payload", {
 *   type: "object",
 *   required: ["bullets"],
 *   properties: { bullets: { type: "array", minItems: 1, items: { type: "string" } } },
 *   additionalProperties: false,
 * });
 * const structured = await svc.chat<{ bullets: string[] }>({
 *   response_format,
 *   messages: [{ role: "user", content: "Summarize Astro in 3 bullets." }],
 * });
 *
 * Streaming example:
 * const stream = svc.chatStream({ messages: [{ role: "user", content: "Tell me a story." }] });
 * for await (const chunk of stream) { if (chunk.delta) process.stdout.write(chunk.delta); }
 *
 * Using withDefaults:
 * const fastSvc = svc.withDefaults({ defaultModel: "gpt-4o-mini", headers: { "HTTP-Referer": "https://example.com" } });
 */
export class OpenRouterError extends Error {
  constructor(
    public type: OpenRouterErrorType,
    message: string,
    public status?: number,
    public retryAfter?: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class OpenRouterService {
  private _config: OpenRouterResolvedConfig;
  private _baseHeaders: Headers;
  private _logger?: OpenRouterLogger;

  constructor(config: OpenRouterConfig) {
    if (!config.apiKey?.trim()) {
      throw new OpenRouterError("config", "Missing OpenRouter API key.");
    }

    this._logger = config.logger;

    const headers = { ...(config.headers ?? {}) };
    this._config = {
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      defaultModel: config.defaultModel,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryBackoffMs: config.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS,
      headers,
      logger: config.logger,
      schemaValidator: config.schemaValidator,
      modelWhitelist: config.modelWhitelist,
      maxInputCharacters: config.maxInputCharacters,
    };

    this._baseHeaders = new Headers();
    this._baseHeaders.set("Content-Type", "application/json");
    this._baseHeaders.set("Accept", "application/json");

    if (this._config.apiKey) {
      this._baseHeaders.set("Authorization", `Bearer ${this._config.apiKey}`);
    }

    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        this._baseHeaders.set(key, value);
      }
    }

    this._logger?.debug?.("OpenRouterService initialized", {
      baseUrl: this._config.baseUrl,
      hasApiKey: Boolean(this._config.apiKey),
    });
  }

  private _validateOptions(options: ChatOptions) {
    if (!options) {
      throw new OpenRouterError("validation", "Options are required.");
    }

    const model = options.model ?? this._config.defaultModel;
    if (!model) {
      throw new OpenRouterError("validation", "Model is required.");
    }

    if (this._config.modelWhitelist?.length && !this._config.modelWhitelist.includes(model)) {
      throw new OpenRouterError("validation", `Model "${model}" is not allowed.`);
    }

    if (!Array.isArray(options.messages) || options.messages.length === 0) {
      throw new OpenRouterError("validation", "At least one message is required.");
    }

    const messages: ChatMessage[] = options.messages.map((message) => {
      if (!message?.role || !message?.content) {
        throw new OpenRouterError("validation", "Each message must include a role and content.");
      }

      const trimmedContent = typeof message.content === "string" ? message.content.trim() : "";
      if (!trimmedContent) {
        throw new OpenRouterError("validation", "Message content must be a non-empty string.");
      }

      const validRoles: ChatMessage["role"][] = ["system", "user", "assistant", "tool"];
      if (!validRoles.includes(message.role)) {
        throw new OpenRouterError("validation", `Unsupported message role: ${message.role}`);
      }

      return { role: message.role, content: trimmedContent };
    });

    const params = options.params ? { ...options.params } : undefined;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) {
          continue;
        }

        if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
          throw new OpenRouterError("validation", `Parameter "${key}" must be a finite number.`);
        }
      }
    }

    const responseFormat = options.response_format;
    if (responseFormat) {
      if (responseFormat.type !== "json_schema") {
        throw new OpenRouterError("validation", "Only json_schema response_format is supported.");
      }

      const { json_schema: jsonSchema } = responseFormat;
      if (!jsonSchema || typeof jsonSchema !== "object") {
        throw new OpenRouterError("validation", "response_format.json_schema must be provided.");
      }

      if (!jsonSchema.name || typeof jsonSchema.name !== "string" || !jsonSchema.name.trim()) {
        throw new OpenRouterError("validation", "response_format.json_schema.name must be a non-empty string.");
      }

      if (typeof jsonSchema.schema !== "object" || jsonSchema.schema === null) {
        throw new OpenRouterError("validation", "response_format.json_schema.schema must be an object.");
      }
    }

    return {
      model,
      messages,
      params,
      response_format: responseFormat,
    };
  }

  private _buildHeaders(extra?: Record<string, string>) {
    const headers = new Headers(this._baseHeaders);

    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value) {
          headers.set(key, value);
        }
      }
    }

    this._logger?.debug?.("Headers built", { headerKeys: Array.from(headers.keys()) });
    return headers;
  }

  private _buildPayload(options: ChatOptions, stream = false) {
    const { model, messages, response_format, params } = this._validateOptions(options);

    const maxInput = this._config.maxInputCharacters;
    if (typeof maxInput === "number" && maxInput > 0) {
      const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
      if (totalChars > maxInput) {
        throw new OpenRouterError("validation", `Input too long (${totalChars} chars). Limit is ${maxInput}.`);
      }
    }

    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    const tokenEstimate = this._estimateTokens(messages);

    // Placeholder for token budgeting; can be extended with a model-specific estimator.
    this._logger?.debug?.("OpenRouter input prepared", {
      model,
      messageCount: messages.length,
      totalChars,
      tokenEstimate,
      stream,
    });

    const cleanedParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined))
      : undefined;

    const payload: Record<string, unknown> = {
      model,
      messages,
      ...(response_format ? { response_format } : {}),
      ...(stream ? { stream: true } : {}),
      ...(cleanedParams ?? {}),
    };

    return payload;
  }

  private async _execute(
    payload: Record<string, unknown>,
    options?: { headers?: Record<string, string>; signal?: AbortSignal; stream?: boolean }
  ): Promise<Response> {
    const { headers: extraHeaders, signal: externalSignal, stream } = options ?? {};
    const headers = this._buildHeaders(extraHeaders);
    const body = JSON.stringify(payload);
    const requestSizeBytes = new TextEncoder().encode(body).length;

    let lastError: OpenRouterError | undefined;

    for (let attempt = 0; attempt <= this._config.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this._config.timeoutMs);

      const onExternalAbort = () => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) {
          clearTimeout(timeoutId);
          throw new OpenRouterError("aborted", "Request aborted by caller signal.");
        }
        externalSignal.addEventListener("abort", onExternalAbort, { once: true });
      }

      const start = performance.now();
      try {
        const response = await fetch(this._config.baseUrl + "/chat/completions", {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        externalSignal?.removeEventListener("abort", onExternalAbort);

        if (response.ok) {
          this._logger?.info?.("OpenRouter request success", {
            model: payload.model,
            stream: Boolean(stream),
            latencyMs: Math.round(performance.now() - start),
            attempt,
            retryCount: attempt,
            requestSizeBytes,
          });
          return response;
        }

        const retryable = this._isRetryableStatus(response.status);
        lastError = new OpenRouterError(
          response.status === 401 || response.status === 403 ? "auth" : "http",
          `OpenRouter responded with status ${response.status}`,
          response.status,
          this._retryAfterSeconds(response)
        );

        if (!retryable || attempt === this._config.maxRetries) {
          this._logger?.error?.("OpenRouter request failed (non-retryable)", {
            status: response.status,
            model: payload.model,
            attempt,
            retryAfter: lastError.retryAfter,
            requestSizeBytes,
          });
          throw lastError;
        }

        const delay = this._backoffDelayMs(attempt);
        this._logger?.warn?.("OpenRouter request retrying", {
          status: response.status,
          model: payload.model,
          attempt,
          delayMs: delay,
          retryAfter: lastError.retryAfter,
          requestSizeBytes,
        });

        await this._sleep(delay);
        continue;
      } catch (error) {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener("abort", onExternalAbort);

        const mapped = this._mapError(error);
        lastError = mapped;

        const retryable = this._isRetryableType(mapped.type) && attempt < this._config.maxRetries;
        if (!retryable) {
          this._logger?.error?.("OpenRouter request failed", {
            type: mapped.type,
            message: mapped.message,
            attempt,
            status: mapped.status,
            retryAfter: mapped.retryAfter,
            requestSizeBytes,
          });
          throw mapped;
        }

        const delay = this._backoffDelayMs(attempt);
        this._logger?.warn?.("OpenRouter request retrying after error", {
          type: mapped.type,
          message: mapped.message,
          attempt,
          delayMs: delay,
          status: mapped.status,
          retryAfter: mapped.retryAfter,
          requestSizeBytes,
        });

        await this._sleep(delay);
        continue;
      }
    }

    throw lastError ?? new OpenRouterError("unknown", "Unknown OpenRouter error.");
  }

  private async *_parseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatChunk> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith("data:")) {
          continue;
        }

        const data = line.slice("data:".length).trim();
        if (data === "[DONE]") {
          yield { done: true, accumulated };
          return;
        }

        try {
          const json = JSON.parse(data) as {
            choices?: { delta?: { content?: string }; message?: { content?: string } }[];
          };
          const choice = json.choices?.[0];
          const delta = choice?.delta?.content ?? choice?.message?.content ?? "";
          if (delta) {
            accumulated += delta;
            yield { delta, accumulated };
          }
        } catch (error) {
          this._logger?.warn?.("Failed to parse stream chunk", { error });
          continue;
        }
      }
    }

    yield { done: true, accumulated };
  }

  private async _normalizeResponse<TContent = string>(
    response: Response,
    options: { response_format?: ResponseFormat }
  ): Promise<ChatResult<TContent>> {
    const json = (await response.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
    };

    const model = json.model ?? "";
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new OpenRouterError("validation", "Response missing message content.");
    }

    let parsed: unknown = content;
    if (options.response_format?.type === "json_schema") {
      try {
        parsed = JSON.parse(content) as TContent;
      } catch (error) {
        throw new OpenRouterError("schema", "Failed to parse structured response JSON.", undefined, undefined, error);
      }

      const validator = this._config.schemaValidator;
      if (validator) {
        const result = validator.validate(options.response_format.json_schema.schema, parsed);
        if (!result.valid) {
          throw new OpenRouterError(
            "schema",
            "Structured response failed schema validation.",
            undefined,
            undefined,
            result.errors
          );
        }
      }
    }

    return {
      model,
      content: parsed as TContent,
      raw: json,
    };
  }

  private _mapError(error: unknown): OpenRouterError {
    if (error instanceof OpenRouterError) {
      return error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      return new OpenRouterError("timeout", "OpenRouter request timed out or was aborted.");
    }

    if (error instanceof Error) {
      return new OpenRouterError("network", error.message, undefined, undefined, error);
    }

    return new OpenRouterError("unknown", "Unknown OpenRouter error.", undefined, undefined, error);
  }

  public setDefaultModel(model: string) {
    if (!model?.trim()) {
      throw new OpenRouterError("validation", "Default model must be a non-empty string.");
    }
    if (this._config.modelWhitelist?.length && !this._config.modelWhitelist.includes(model)) {
      throw new OpenRouterError("validation", `Model "${model}" is not allowed.`);
    }
    this._config.defaultModel = model.trim();
  }

  public withDefaults(partial: Partial<OpenRouterConfig>) {
    return new OpenRouterService({
      ...this._config,
      ...partial,
      apiKey: partial.apiKey ?? this._config.apiKey,
    });
  }

  public buildResponseFormat(name: string, schema: object): ResponseFormat {
    if (!name?.trim()) {
      throw new OpenRouterError("validation", "Schema name is required.");
    }
    if (!schema || typeof schema !== "object") {
      throw new OpenRouterError("validation", "Schema must be an object.");
    }
    return {
      type: "json_schema",
      json_schema: {
        name: name.trim(),
        strict: true,
        schema,
      },
    };
  }

  /**
   * Non-streaming chat completion. Returns full content (or parsed structured content when response_format is set).
   */
  public async chat<TContent = string>(options: ChatOptions): Promise<ChatResult<TContent>> {
    const payload = this._buildPayload(options, false);
    const response = await this._execute(payload, {
      headers: options.headers,
      signal: options.signal,
      stream: false,
    });
    return this._normalizeResponse<TContent>(response, { response_format: options.response_format });
  }

  /**
   * Streaming chat completion. Yields incremental deltas and final accumulated text.
   */
  public async *chatStream(options: ChatOptions): AsyncGenerator<ChatChunk> {
    const payload = this._buildPayload(options, true);
    const response = await this._execute(payload, {
      headers: options.headers,
      signal: options.signal,
      stream: true,
    });

    const body = response.body;
    if (!body) {
      throw new OpenRouterError("network", "Streaming response body is empty.");
    }

    let accumulated = "";
    for await (const chunk of this._parseStream(body)) {
      if (chunk.delta) {
        accumulated = chunk.accumulated ?? accumulated + chunk.delta;
      }
      yield chunk;
    }
  }

  private _isRetryableStatus(status: number) {
    return status === 429 || (status >= 500 && status < 600);
  }

  private _retryAfterSeconds(response: Response): number | undefined {
    const header = response.headers.get("retry-after");
    if (!header) return undefined;
    const seconds = Number(header);
    return Number.isFinite(seconds) ? seconds : undefined;
  }

  private _isRetryableType(type: OpenRouterErrorType) {
    return type === "timeout" || type === "network" || type === "http";
  }

  private _backoffDelayMs(attempt: number) {
    return this._config.retryBackoffMs * Math.pow(2, attempt);
  }

  private _sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _estimateTokens(messages: ChatMessage[]): number {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.max(1, Math.ceil(totalChars / 4)); // rough heuristic; swap with model-specific estimator if available
  }
}
