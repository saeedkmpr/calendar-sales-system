const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function extractErrorMessage(res: Response): Promise<string> {
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return 'സെർവർ ആരംഭിക്കുകയാണ് (Waking up), ദയവായി ഏതാനും നിമിഷങ്ങൾക്കകം വീണ്ടും ശ്രമിക്കുക';
  }
  try {
    const err = await res.json();
    return err.error || `HTTP error ${res.status}`;
  } catch {
    return `HTTP error ${res.status}`;
  }
}

/**
 * Automatically retry requests when the free backend is waking up (502 / 503 / 504)
 * Retries up to 12 times (approx 40 seconds) to ensure cold starts resolve seamlessly without user errors.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 12, delay = 3000): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if ((res.status === 502 || res.status === 503 || res.status === 504) && retries > 0) {
      console.warn(`[API] Server waking up (HTTP ${res.status}). Waiting for spin-up... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`[API] Connection warming up. Retrying... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    throw err;
  }
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }
    return res.json();
  }

  async getText(endpoint: string): Promise<string> {
    const res = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }
    return res.text();
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const res = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }
    return res.json();
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    const res = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }
    return res.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }
    return res.json();
  }

  /**
   * Direct in-page file download without popups, using JWT Authorization header
   */
  async downloadFile(endpoint: string, fallbackFilename: string): Promise<void> {
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'ഡൗൺലോഡ് പരാജയപ്പെട്ടു' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Open print / PDF preview in new window with embedded auth token
   */
  openPrintWindow(endpoint: string): void {
    const token = this.getToken();
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${endpoint}${token ? `${separator}token=${encodeURIComponent(token)}` : ''}`;
    window.open(url, '_blank');
  }
}

export const api = new ApiService();

// Automatically keep backend awake every 4 minutes while any user has the tab open
if (typeof window !== 'undefined') {
  setInterval(() => {
    fetch(`${BASE_URL}/health`).catch(() => {});
  }, 4 * 60 * 1000);
}
