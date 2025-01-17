const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const timeout = 30000; // 30 seconds timeout

export async function* streamCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiKey: string
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader available');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.includes('[DONE]')) return;

          try {
            const json = JSON.parse(line.replace('data: ', ''));
            if (json.choices[0].delta.content) {
              yield json.choices[0].delta.content;
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}