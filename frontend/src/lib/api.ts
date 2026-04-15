const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  error: string;
  details?: any;
}

interface ApiResponse<T> {
  data?: T;
  error?: string | ApiError;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { 
          error: {
            error: data.error || 'Request failed',
            details: data.details,
          },
        };
      }

      return { data };
    } catch (error) {
      return { 
        error: {
          error: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Auth
  async signup(email: string, password: string, name: string, company?: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, company }),
    });

    if (result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  async login(email: string, password: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }

    return result;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // Companies
  async getCompanies() {
    return this.request<string[]>('/auth/companies');
  }

  // Candidates
  async uploadCV(file: File) {
    const formData = new FormData();
    formData.append('cv', file);

    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/candidates/upload-cv`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Upload failed' };
    }
    return { data };
  }

  async createCandidate(candidateData: {
    name: string;
    role: string;
    email: string;
    phone?: string;
    fullRole?: string;
    cvUrl?: string;
    extractedData?: any;
    appliedCompany?: string;
    jobField?: string;
  }) {
    return this.request('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidateData),
    });
  }

  async getCandidates() {
    return this.request<any[]>('/candidates');
  }

  async getCandidate(id: string) {
    return this.request<any>(`/candidates/${id}`);
  }

  async publicParseCV(file: File) {
    const formData = new FormData();
    formData.append('cv', file);

    const response = await fetch(`${API_BASE_URL}/candidates/public-parse-cv`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Parsing failed', details: data.details };
    }
    return { data };
  }

  async publicApply(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/candidates/public-apply`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Application failed' };
    }
    return { data };
  }

  // Interviews
  async generateQuestions(role: string) {
    return this.request<{ questions: string[] }>('/interviews/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  async createInterview(candidateId: string, questions: string[]) {
    return this.request<any>('/interviews', {
      method: 'POST',
      body: JSON.stringify({ candidateId, questions }),
    });
  }

  async startInterview(interviewId: string) {
    return this.request<any>(`/interviews/${interviewId}/start`, {
      method: 'POST',
    });
  }

  async addTranscriptEntry(
    interviewId: string,
    speaker: 'AI' | 'Candidate',
    text: string,
    timestamp?: number,
    questionIndex?: number
  ) {
    return this.request<any>(`/interviews/${interviewId}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ speaker, text, timestamp, questionIndex }),
    });
  }

  async analyzeResponse(interviewId: string, question: string, response: string) {
    return this.request<{
      sentiment: number;
      confidence: string;
      redFlags: string[];
      summary: string;
    }>(`/interviews/${interviewId}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ question, response }),
    });
  }

  async completeInterview(interviewId: string) {
    return this.request<any>(`/interviews/${interviewId}/complete`, {
      method: 'POST',
    });
  }

  async getInterview(interviewId: string) {
    return this.request<any>(`/interviews/${interviewId}`);
  }

  async getInterviews() {
    return this.request<any[]>('/interviews');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<{
      stats: {
        totalInterviews: number;
        completed: number;
        inProgress: number;
        avgSentiment: number;
      };
      recentInterviews: any[];
    }>('/dashboard/stats');
  }
}

export const api = new ApiClient();

