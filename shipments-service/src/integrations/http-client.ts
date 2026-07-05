import { BadGatewayException } from '@nestjs/common';

export async function postJson<TResponse>(
  url: string,
  body: unknown,
  timeoutMs: number,
  correlationId: string,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new BadGatewayException({
        message: `Fallo llamada REST a ${url}`,
        statusCode: response.status,
        payload,
        correlationId,
      });
    }

    return payload as TResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function deleteJson<TResponse>(
  url: string,
  timeoutMs: number,
  correlationId: string,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Correlation-Id': correlationId,
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new BadGatewayException({
        message: `Fallo compensacion REST a ${url}`,
        statusCode: response.status,
        payload,
        correlationId,
      });
    }

    return payload as TResponse;
  } finally {
    clearTimeout(timeout);
  }
}
