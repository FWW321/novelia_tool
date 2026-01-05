class ApiService {
  private static get token(): string | null {
    const auth = localStorage.getItem('auth');
    if (auth) {
      try {
        const parsedInfo = JSON.parse(auth);
        return parsedInfo.profile?.token || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public static async fetch(url: string, bypass: boolean = true): Promise<Response> {
    if (bypass && this.token) {
      return await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
    } else {
      return await fetch(url);
    }
  }

  public static delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

export default ApiService;
