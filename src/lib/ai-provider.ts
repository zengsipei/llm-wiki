/**
 * AI Provider 抽象层
 *
 * 统一接口支持多种 LLM 后端：
 * - z-ai    (z-ai-web-dev-sdk)
 * - openai  (OpenAI API / 兼容接口)
 * - anthropic (Anthropic Claude API)
 * - custom  (任意 OpenAI-compatible 自定义端点)
 *
 * 环境变量配置：
 *   AI_PROVIDER=z-ai|openai|anthropic|custom
 *   AI_MODEL=              可选，覆盖默认模型
 *   AI_BASE_URL=           OpenAI/Custom 的 base URL
 *   AI_API_KEY=            OpenAI/Anthropic/Custom 的 API key
 *   AI_MAX_TOKENS=         可选，最大输出 token
 *   AI_TEMPERATURE=        可选，默认温度
 *   ZAI_CONFIG_PATH=       可选，.z-ai-config 文件路径
 */

// ─── 公共类型 ──────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface ChatCompletionResult {
  content: string
  model: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}

/** Provider 配置 */
export interface ProviderConfig {
  provider: 'z-ai' | 'openai' | 'anthropic' | 'custom'
  model?: string
  baseUrl?: string
  apiKey?: string
  maxTokens?: number
  temperature?: number
  /** z-ai 专用：config 文件路径 */
  zaiConfigPath?: string
}

// ─── Provider 接口 ─────────────────────────────────────────

export interface AIProvider {
  /** provider 标识 */
  readonly name: string
  /** 使用的模型名 */
  readonly model: string
  /** 非流式对话补全 */
  complete(options: ChatCompletionOptions): Promise<ChatCompletionResult>
}

// ─── 工具函数 ──────────────────────────────────────────────

/** 从环境变量读取配置 */
export function getConfig(): ProviderConfig {
  return {
    provider: (process.env.AI_PROVIDER as ProviderConfig['provider']) || 'z-ai',
    model: process.env.AI_MODEL,
    baseUrl: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    maxTokens: process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS, 10) : undefined,
    temperature: process.env.AI_TEMPERATURE ? parseFloat(process.env.AI_TEMPERATURE) : undefined,
    zaiConfigPath: process.env.ZAI_CONFIG_PATH,
  }
}

/** 从 AI 响应中清理 markdown code fence 包裹 */
export function cleanJsonResponse(raw: string): string {
  return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
}

/** 安全解析 AI 返回的 JSON，失败时返回 fallback */
export function parseAIJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(cleanJsonResponse(raw))
  } catch {
    return fallback
  }
}

// ─── ZAI Provider ──────────────────────────────────────────

class ZAIProvider implements AIProvider {
  readonly name = 'z-ai'
  readonly model: string
  private _zai: any = null

  constructor(config: ProviderConfig) {
    this.model = config.model || 'default'
  }

  private async getClient() {
    if (!this._zai) {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      this._zai = await ZAI.create()
    }
    return this._zai
  }

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const zai = await this.getClient()
    const completion = await zai.chat.completions.create({
      messages: options.messages,
      temperature: options.temperature,
    })
    return {
      content: completion.choices?.[0]?.message?.content || '',
      model: completion.model || this.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens ?? 0,
            completionTokens: completion.usage.completion_tokens ?? 0,
            totalTokens: completion.usage.total_tokens ?? 0,
          }
        : undefined,
    }
  }
}

// ─── OpenAI Provider ───────────────────────────────────────

class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  readonly model: string
  private baseUrl: string
  private apiKey: string
  private _client: any = null

  constructor(config: ProviderConfig) {
    this.model = config.model || 'gpt-4o-mini'
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
    this.apiKey = config.apiKey || ''
  }

  private async getClient() {
    if (!this._client) {
      const { default: OpenAI } = await import('openai')
      this._client = new OpenAI({ baseURL: this.baseUrl, apiKey: this.apiKey })
    }
    return this._client
  }

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = await this.getClient()
    const completion = await client.chat.completions.create({
      model: this.model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    })
    return {
      content: completion.choices?.[0]?.message?.content || '',
      model: completion.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens ?? 0,
            completionTokens: completion.usage.completion_tokens ?? 0,
            totalTokens: completion.usage.total_tokens ?? 0,
          }
        : undefined,
    }
  }
}

// ─── Anthropic Provider ────────────────────────────────────

class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  readonly model: string
  private apiKey: string
  private baseUrl: string
  private _client: any = null

  constructor(config: ProviderConfig) {
    this.model = config.model || 'claude-sonnet-4-20250514'
    this.apiKey = config.apiKey || ''
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com'
  }

  private async getClient() {
    if (!this._client) {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      this._client = new Anthropic({ apiKey: this.apiKey, baseURL: this.baseUrl || undefined })
    }
    return this._client
  }

  async complete(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const client = await this.getClient()
    // Anthropic API: system message separate from messages array
    const systemMsg = options.messages.find(m => m.role === 'system')?.content
    const nonSystemMessages = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const completion = await client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 4096,
      system: systemMsg,
      messages: nonSystemMessages,
      temperature: options.temperature,
    })

    // Anthropic returns content blocks; extract text
    const textBlock = completion.content.find((b: any) => b.type === 'text')
    return {
      content: textBlock?.text || '',
      model: completion.model,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.input_tokens ?? 0,
            completionTokens: completion.usage.output_tokens ?? 0,
            totalTokens: (completion.usage.input_tokens ?? 0) + (completion.usage.output_tokens ?? 0),
          }
        : undefined,
    }
  }
}

// ─── Custom Provider (OpenAI-compatible) ───────────────────

class CustomProvider extends OpenAIProvider {
  readonly name = 'custom'

  constructor(config: ProviderConfig) {
    if (!config.baseUrl) {
      throw new Error('Custom provider requires AI_BASE_URL environment variable')
    }
    super(config)
  }
}

// ─── 工厂函数 ──────────────────────────────────────────────

let _cachedProvider: AIProvider | null = null

/**
 * 创建 AI Provider 实例
 * @param config 可选配置，默认从环境变量读取
 * @param forceNew 是否强制创建新实例（用于测试）
 */
export function createProvider(config?: Partial<ProviderConfig>, forceNew = false): AIProvider {
  if (_cachedProvider && !config && !forceNew) {
    return _cachedProvider
  }

  const fullConfig = { ...getConfig(), ...config }
  let provider: AIProvider

  switch (fullConfig.provider) {
    case 'openai':
      provider = new OpenAIProvider(fullConfig)
      break
    case 'anthropic':
      provider = new AnthropicProvider(fullConfig)
      break
    case 'custom':
      provider = new CustomProvider(fullConfig)
      break
    case 'z-ai':
    default:
      provider = new ZAIProvider(fullConfig)
      break
  }

  if (!config && !forceNew) {
    _cachedProvider = provider
  }

  return provider
}

/** 便捷方法：直接调用 AI 补全 */
export async function aiComplete(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ChatCompletionResult> {
  const provider = createProvider()
  return provider.complete({ messages, ...options })
}
