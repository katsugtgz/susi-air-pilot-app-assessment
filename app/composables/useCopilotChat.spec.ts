import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseSseFrames, useCopilotChat } from './useCopilotChat'

describe('parseSseFrames', () => {
  it('parses a single text-delta frame', () => {
    const out = parseSseFrames('data: {"text":"hello"}\n\n')
    expect(out).toEqual([{ payload: { text: 'hello' } }])
  })

  it('parses multiple frames in one buffer', () => {
    const buf = 'data: {"text":"a"}\n\ndata: {"text":"b"}\n\n'
    expect(parseSseFrames(buf)).toEqual([
      { payload: { text: 'a' } },
      { payload: { text: 'b' } },
    ])
  })

  it('recognizes [DONE] terminator', () => {
    expect(parseSseFrames('data: [DONE]\n\n')).toEqual([{ done: true }])
  })

  it('concatenates multi-line data payloads', () => {
    const buf = 'data: line1\ndata: line2\n\n'
    // Joined by \n then JSON.parse — "line1\nline2" is not valid JSON so it
    // is skipped silently.
    expect(parseSseFrames(buf)).toEqual([])
  })

  it('skips malformed JSON without throwing', () => {
    expect(parseSseFrames('data: not json\n\n')).toEqual([])
  })

  it('skips heartbeats / comments', () => {
    expect(parseSseFrames(': heartbeat\n\n')).toEqual([])
  })

  it('handles CRLF line endings', () => {
    expect(parseSseFrames('data: {"text":"hi"}\r\n\r\n')).toEqual([{ payload: { text: 'hi' } }])
  })
})

describe('useCopilotChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  function makeStreamBody(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder()
    return new ReadableStream({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c))
        controller.close()
      },
    })
  }

  it('starts empty', () => {
    const { messages, isStreaming, error } = useCopilotChat()
    expect(messages.value).toEqual([])
    expect(isStreaming.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('appends a user + assistant pair on send', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(makeStreamBody(['data: {"text":"hi"}\n\ndata: [DONE]\n\n']), {
        status: 200,
      }),
    )
    const { messages, send } = useCopilotChat()
    await send('hello')
    expect(messages.value).toHaveLength(2)
    expect(messages.value[0]?.role).toBe('user')
    expect(messages.value[0]?.text).toBe('hello')
    expect(messages.value[1]?.role).toBe('assistant')
    expect(messages.value[1]?.text).toBe('hi')
  })

  it('concatenates multiple streamed deltas', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        makeStreamBody([
          'data: {"text":"Hel"}\n\n',
          'data: {"text":"lo"}\n\n',
          'data: [DONE]\n\n',
        ]),
        { status: 200 },
      ),
    )
    const { messages, send } = useCopilotChat()
    await send('greet')
    expect(messages.value[1]?.text).toBe('Hello')
  })

  it('handles 503 with friendly not-configured message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('not configured', { status: 503 }),
    )
    const { messages, send } = useCopilotChat()
    await send('hi')
    expect(messages.value[1]?.text).toContain("isn't configured")
  })

  it('sets error on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('boom', { status: 500 }),
    )
    const { error, send } = useCopilotChat()
    await send('hi')
    expect(error.value).toMatch(/failed/)
  })

  it('refuses to send while streaming', async () => {
    // First call hangs until reader finishes; second call should no-op.
    let resolveStream: () => void
    const hanging = new Promise<void>((r) => {
      resolveStream = r
    })
    vi.mocked(fetch).mockImplementation(async () => {
      await hanging
      return new Response(makeStreamBody(['data: [DONE]\n\n']), { status: 200 })
    })
    const { send } = useCopilotChat()
    const p1 = send('one')
    await Promise.resolve()
    await send('two') // should be a no-op
    resolveStream!()
    await p1
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
  })

  it('ignores empty / whitespace text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(makeStreamBody(['data: [DONE]\n\n']), { status: 200 }),
    )
    const { send, messages } = useCopilotChat()
    await send('   ')
    expect(messages.value).toEqual([])
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('reset clears messages + error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(makeStreamBody(['data: [DONE]\n\n']), { status: 200 }),
    )
    const c = useCopilotChat()
    await c.send('x')
    expect(c.messages.value.length).toBeGreaterThan(0)
    c.reset()
    expect(c.messages.value).toEqual([])
    expect(c.error.value).toBeNull()
  })
})
