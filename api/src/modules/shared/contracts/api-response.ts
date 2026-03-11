export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  correlationId: string;
  version?: number;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  correlationId: string;
}

export function okResponse<T>(
  data: T,
  correlationId: string,
  version?: number,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    correlationId,
    ...(typeof version === 'number' ? { version } : {}),
  };
}
