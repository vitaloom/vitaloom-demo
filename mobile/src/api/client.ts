const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly statusCode: number | null;

  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (!baseUrl) {
    throw new ApiError(
      "Chưa cấu hình EXPO_PUBLIC_API_BASE_URL. Hãy tạo file mobile/.env và nhập IP LAN của PC.",
    );
  }

  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const abortFromCaller = () => controller.abort();
  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener("abort", abortFromCaller);
  }

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(baseUrl + path, {
      ...init,
      headers,
      signal: controller.signal,
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const body = payload as ApiErrorBody | null;
      const message =
        body?.error?.message ??
        "Máy chủ từ chối yêu cầu (HTTP " + response.status + ").";
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (externalSignal?.aborted) {
      throw new ApiError("Yêu cầu đã bị hủy.", null);
    }
    if (timedOut) {
      throw new ApiError("Máy chủ phản hồi quá chậm. Vui lòng thử lại.", null);
    }
    throw new ApiError(
      "Không thể kết nối đến máy chủ. Kiểm tra IP LAN, Wi-Fi và cấu hình API.",
      null,
    );
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
}
