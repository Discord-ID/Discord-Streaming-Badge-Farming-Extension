export interface RestRequestOptions {
  url: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
}

export interface RestResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  text?: string;
}

export interface RestClient {
  get<T = unknown>(options: RestRequestOptions): Promise<RestResponse<T>>;
  post<T = unknown>(options: RestRequestOptions): Promise<RestResponse<T>>;
  put<T = unknown>(options: RestRequestOptions): Promise<RestResponse<T>>;
  patch<T = unknown>(options: RestRequestOptions): Promise<RestResponse<T>>;
  del<T = unknown>(options: RestRequestOptions): Promise<RestResponse<T>>;
}
