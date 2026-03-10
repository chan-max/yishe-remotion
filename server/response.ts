/**
 * API 统一响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
}

/**
 * 错误码定义
 */
export const ErrorCode = {
  SUCCESS: "SUCCESS",
  INVALID_REQUEST: "INVALID_REQUEST",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  JOB_NOT_FOUND: "JOB_NOT_FOUND",
  JOB_NOT_CANCELLABLE: "JOB_NOT_CANCELLABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * 成功响应
 */
export function success<T>(data: T, message = "操作成功"): ApiResponse<T> {
  return {
    success: true,
    code: ErrorCode.SUCCESS,
    message,
    data,
  };
}

/**
 * 错误响应
 */
export function error(
  code: string,
  message: string,
  data?: unknown,
): ApiResponse {
  return {
    success: false,
    code,
    message,
    data,
  };
}
