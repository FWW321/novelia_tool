class ApiService {
  static get token(): string | null {
    const auth = localStorage.getItem('auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        return parsed.profile?.token || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  static async fetchWithAuth(url: string, r18Bypass: boolean = false): Promise<Response> {
    const headers: HeadersInit = {};
    if (r18Bypass) {
        const t = this.token;
        if (t) headers['Authorization'] = `Bearer ${t}`;
    }
    return fetch(url, { headers });
  }

  static async fetchWenku(id: string, r18Bypass: boolean): Promise<any> {
    const res = await this.fetchWithAuth(`${window.location.origin}/api/wenku/${id}`, r18Bypass);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  }
}

export default ApiService;
