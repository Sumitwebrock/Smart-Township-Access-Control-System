/**
 * Central API client – all requests go through Vite's `/api` proxy
 * which strips the prefix and forwards to http://localhost:8000
 */

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? 'API error');
  }
  return res.json() as Promise<T>;
}

// ─── Types (mirror backend schemas) ────────────────────────────────────────

export interface Employee {
  id: number;
  name: string;
  house_number: string;
  rfid_tag: string;
  vehicle_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Visitor {
  id: number;
  name: string;
  phone: string;
  house_number: string;
  vehicle_number: string | null;
  photo_path: string | null;
  visit_count: number;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntryLog {
  id: number;
  person_type: 'employee' | 'visitor';
  person_id: number;
  vehicle_number: string | null;
  entry_time: string;
  exit_time: string | null;
  gate_id: string | null;
  remarks: string | null;
}

export interface Alert {
  id: number;
  alert_type: 'panic' | 'fire' | 'accident' | 'intrusion' | 'other';
  location: string;
  description: string | null;
  raised_by: string | null;
  created_at: string;
  status: 'open' | 'acknowledged' | 'resolved';
  resolved_at: string | null;
}

export interface RFIDScanResponse {
  access_granted: boolean;
  message: string;
  employee?: Employee;
  entry_log_id?: number;
}

// ─── Employees ──────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (params?: { active_only?: boolean; skip?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.active_only) q.set('active_only', 'true');
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return request<Employee[]>(`/employees?${q}`);
  },
    register: (data: { name: string; house_number: string; rfid_tag: string; vehicle_number?: string }) =>
      request<Employee>('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  update: (id: number, data: Partial<Employee>) =>
    request<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── Visitors ───────────────────────────────────────────────────────────────

export const visitorsApi = {
  list: (params?: { blocked_only?: boolean; skip?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.blocked_only) q.set('blocked_only', 'true');
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return request<Visitor[]>(`/visitors?${q}`);
  },
  update: (id: number, data: { is_blocked?: boolean; name?: string; phone?: string }) =>
    request<Visitor>(`/visitors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  register: (formData: FormData) =>
    fetch(`${BASE}/visitors/register`, { method: 'POST', body: formData }).then(
      async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }));
          
          // Handle FastAPI validation errors (detail is an array)
          if (Array.isArray(err.detail)) {
            const messages = err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
            throw new Error(messages);
          }
          
          // Handle detail as object
          if (typeof err.detail === 'object' && err.detail !== null) {
            throw new Error(JSON.stringify(err.detail));
          }
          
          throw new Error(err.detail ?? 'Registration failed');
        }
        return res.json() as Promise<Visitor>;
      },
    ),
};

// ─── Entry Logs ─────────────────────────────────────────────────────────────

export const entryLogsApi = {
  list: (params?: {
    from_date?: string;
    to_date?: string;
    person_type?: string;
    gate_id?: string;
    skip?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.from_date) q.set('from_date', params.from_date);
    if (params?.to_date) q.set('to_date', params.to_date);
    if (params?.person_type) q.set('person_type', params.person_type);
    if (params?.gate_id) q.set('gate_id', params.gate_id);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return request<EntryLog[]>(`/entry-logs?${q}`);
  },
};

// ─── Alerts ─────────────────────────────────────────────────────────────────

export const alertsApi = {
  list: (params?: { status?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.skip !== undefined) q.set('skip', String(params.skip));
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    return request<Alert[]>(`/alerts?${q}`);
  },
  update: (id: number, data: { status?: string; description?: string }) =>
    request<Alert>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ─── RFID ────────────────────────────────────────────────────────────────────

export const rfidApi = {
  scan: (rfid_tag: string, gate_id?: string) =>
    request<RFIDScanResponse>('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({ rfid_tag, gate_id }),
    }),
};
