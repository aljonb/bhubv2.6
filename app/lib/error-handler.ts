import { NextRequest, NextResponse } from 'next/server';

/**
 * Secure error handling utility for API routes
 * Logs detailed errors server-side while returning safe messages to clients
 */

interface ErrorContext {
  userId?: string;
  endpoint: string;
  method: string;
  userAgent?: string;
}

interface SecureErrorResponse {
  error: string;
  code?: string;
  timestamp: string;
}

/**
 * Handle errors securely - log details server-side, return generic message to client
 */
export function handleApiError(
  error: unknown,
  context: ErrorContext,
  customMessage?: string
): { response: SecureErrorResponse; status: number } {
  
  // Generate error ID for tracking
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add this to the handleApiError function
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Only log stack traces in development
  console.error(`[${errorId}] API Error:`, {
    error: error instanceof Error ? {
      message: error.message,
      stack: isDevelopment ? error.stack : '[REDACTED]',
      name: error.name
    } : error,
    context,
    timestamp: new Date().toISOString()
  });

  // Determine appropriate status code and message
  let status = 500;
  let message = customMessage || 'Internal server error';
  let code: string | undefined;

  // Handle specific error types
  if (error instanceof Error) {
    // Stripe errors
    if (error.message.includes('No such customer') || error.message.includes('No such payment_intent')) {
      status = 404;
      message = 'Resource not found';
      code = 'RESOURCE_NOT_FOUND';
    }
    // Rate limiting errors
    else if (error.message.includes('rate_limit') || error.message.includes('too many requests')) {
      status = 429;
      message = 'Too many requests';
      code = 'RATE_LIMITED';
    }
    // Authentication errors
    else if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
      status = 401;
      message = 'Authentication required';
      code = 'UNAUTHORIZED';
    }
    // Validation errors
    else if (error.message.includes('validation') || error.message.includes('invalid')) {
      status = 400;
      message = 'Invalid request';
      code = 'VALIDATION_ERROR';
    }
  }

  // Return safe response
  return {
    response: {
      error: message,
      code,
      timestamp: new Date().toISOString()
    },
    status
  };
}

/**
 * Wrapper for API route error handling
 */
export function withErrorHandler<T extends readonly unknown[]>(
  handler: (...args: T) => Promise<Response>,
  endpoint: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as NextRequest;
      const context: ErrorContext = {
        endpoint,
        method: request.method,
        userAgent: request.headers.get('user-agent') || undefined
      };

      const { response, status } = handleApiError(error, context);
      return NextResponse.json(response, { status });
    }
  };
} 