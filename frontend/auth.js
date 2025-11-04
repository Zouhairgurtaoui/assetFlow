class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:5000/auth';
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            return data;
        } catch (error) {
            throw error;
        }
    }

    async register(username, password, role) {
        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, role }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    getToken() {
        return localStorage.getItem('token');
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    async validateToken() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const response = await fetch(`${this.baseURL}/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Token invalid');
            }

            return await response.json();
        } catch (error) {
            this.logout();
            throw error;
        }
    }
}

const authService = new AuthService();
