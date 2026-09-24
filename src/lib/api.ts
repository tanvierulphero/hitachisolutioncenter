import { Product, Customer, Document, StaffUser, BusinessSettings } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (err: any) {
    throw new Error(`Network Error: ${err.message || 'Server unreachable'}`);
  }

  // If 404, attempt direct PHP endpoint fallback e.g. /api/index.php?endpoint=products
  if (response.status === 404 && url.startsWith('/api/') && !url.startsWith('/api/index.php')) {
    const rawPath = url.replace(/^\/api\//, '');
    const parts = rawPath.split('/').filter(Boolean);
    const endpoint = parts[0] || '';
    const id = parts[1] || '';
    const fallbackUrl = `/api/index.php?endpoint=${encodeURIComponent(endpoint)}${id ? `&id=${encodeURIComponent(id)}` : ''}`;

    try {
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (fallbackResponse.ok) {
        return fallbackResponse.json();
      }
    } catch {
      // Ignore fallback network error and throw clear error below
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    
    if (response.status === 404) {
      throw new Error(`HTTP 404 Not Found: 'api' folder or '.htaccess' is missing in cPanel public_html. Please upload the full contents of your 'dist' folder to public_html.`);
    }

    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Products API
export const apiGetProducts = (): Promise<Product[]> => fetchJson<Product[]>('/api/products');
export const apiSaveProduct = (product: Product): Promise<Product> =>
  fetchJson<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
export const apiDeleteProduct = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' });

// Customers API
export const apiGetCustomers = (): Promise<Customer[]> => fetchJson<Customer[]>('/api/customers');
export const apiSaveCustomer = (customer: Customer): Promise<Customer> =>
  fetchJson<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
export const apiDeleteCustomer = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/customers/${id}`, { method: 'DELETE' });

// Documents API
export const apiGetDocuments = (): Promise<Document[]> => fetchJson<Document[]>('/api/documents');
export const apiSaveDocument = (doc: Document): Promise<Document> =>
  fetchJson<Document>('/api/documents', {
    method: 'POST',
    body: JSON.stringify(doc),
  });
export const apiDeleteDocument = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' });

// Staff API
export const apiGetStaff = (): Promise<StaffUser[]> => fetchJson<StaffUser[]>('/api/staff');
export const apiSaveStaff = (staff: StaffUser): Promise<StaffUser> =>
  fetchJson<StaffUser>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(staff),
  });
export const apiDeleteStaff = (id: string): Promise<{ success: boolean }> =>
  fetchJson<{ success: boolean }>(`/api/staff/${id}`, { method: 'DELETE' });

// Settings API
export const apiGetSettings = (): Promise<BusinessSettings> => fetchJson<BusinessSettings>('/api/settings');
export const apiSaveSettings = (settings: BusinessSettings): Promise<BusinessSettings> =>
  fetchJson<BusinessSettings>('/api/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });

// Image Upload API
export async function apiUploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch('/api/upload.php', {
      method: 'POST',
      body: formData,
    });
  } catch {
    try {
      response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
    } catch (err: any) {
      throw new Error(`Upload Failed: ${err.message || 'Server unreachable'}`);
    }
  }

  if (!response.ok) {
    if (response.status === 404) {
      try {
        const fallbackRes = await fetch('/api/index.php?endpoint=upload', {
          method: 'POST',
          body: formData,
        });
        if (fallbackRes.ok) {
          return fallbackRes.json();
        }
      } catch {
        // ignore
      }
    }

    const err = await response.json().catch(() => ({ error: 'Image upload failed' }));
    throw new Error(err.error || 'Image upload failed');
  }

  return response.json();
}
