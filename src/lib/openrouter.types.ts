export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ResponseFormatJsonSchema {
  type: "json_schema";
  json_schema: {
    name: string;
    strict?: boolean;
    schema: object;
  };
}

export type ResponseFormat = ResponseFormatJsonSchema;

export interface ModelParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  params?: ModelParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ChatResult<TContent = string> {
  model: string;
  content: TContent;
  raw: unknown;
}

export interface ChatChunk {
  delta?: string;
  done?: boolean;
  accumulated?: string;
}

export type OpenRouterErrorType =
  | "auth"
  | "timeout"
  | "http"
  | "network"
  | "validation"
  | "schema"
  | "aborted"
  | "config"
  | "unknown";

export interface OpenRouterLogger {
  debug?(message: string, meta?: Record<string, unknown>): void;
  info?(message: string, meta?: Record<string, unknown>): void;
  warn?(message: string, meta?: Record<string, unknown>): void;
  error?(message: string, meta?: Record<string, unknown>): void;
}

export interface SchemaValidator {
  validate(schema: object, data: unknown): { valid: boolean; errors?: unknown };
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryBackoffMs?: number;
  headers?: Record<string, string>;
  logger?: OpenRouterLogger;
  schemaValidator?: SchemaValidator;
  modelWhitelist?: string[];
  maxInputCharacters?: number;
}

export interface OpenRouterResolvedConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel?: string;
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number;
  headers: Record<string, string>;
  logger?: OpenRouterLogger;
  schemaValidator?: SchemaValidator;
  modelWhitelist?: string[];
  maxInputCharacters?: number;
}
