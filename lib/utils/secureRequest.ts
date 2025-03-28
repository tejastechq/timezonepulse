/**
 * Secure HTTP request helper with built-in security headers and validations
 */

type RequestOptions = {
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
};

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class RequestError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

export async function secureRequest<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  options: RequestOptions = {}
): Promise<T> {
  const {
    headers = {},
    body,
    timeout = DEFAULT_TIMEOUT,
    validateStatus = (status: number) => status >= 200 && status < 300,
  } = options;

  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new RequestError('Invalid URL provided');
  }

  // Setup request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      signal: controller.signal,
    });

    // Clear timeout
    clearTimeout(timeoutId);

    // Validate response status
    if (!validateStatus(response.status)) {
      throw new RequestError(
        `Request failed with status ${response.status}`,
        response.status,
        await response.json().catch(() => null)
      );
    }

    // Parse response
    const data = await response.json();

    // Validate response structure if needed
    if (!data) {
      throw new RequestError('Invalid response format');
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof RequestError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RequestError('Request timeout');
    }

    throw new RequestError(
      error instanceof Error ? error.message : 'Request failed',
      undefined,
      error
    );
  } finally {
    clearTimeout(timeoutId);
  }
}