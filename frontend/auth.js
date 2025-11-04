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
                let errorMessage = 'Login failed';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Handle both access_token and token keys
            const token = data.access_token || data.token;
            if (!token) {
                throw new Error('Token not received from server');
            }
            localStorage.setItem('token', token);
            return data;
        } catch (error) {
            // Handle network errors (CORS, connection refused, etc.)
            // Check for actual network failures, not validation errors
            if (error.message === 'Failed to fetch' || 
                (error.name === 'TypeError' && error.message.includes('fetch')) ||
                error.message.includes('NetworkError') ||
                error.message.includes('Network request failed')) {
                throw new Error('Unable to connect to server. Please make sure the backend services are running on ports 5000 and 8000.');
            }
            // Re-throw other errors (validation, server errors, etc.)
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
                let errorMessage = 'Registration failed';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            // Handle network errors (CORS, connection refused, etc.)
            // Check for actual network failures, not validation errors
            if (error.message === 'Failed to fetch' || 
                (error.name === 'TypeError' && error.message.includes('fetch')) ||
                error.message.includes('NetworkError') ||
                error.message.includes('Network request failed')) {
                throw new Error('Unable to connect to server. Please make sure the backend services are running on ports 5000 and 8000.');
            }
            // Re-throw other errors (validation, server errors, etc.)
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
        if (!token) {
            throw new Error('No token available');
        }

        try {
            const response = await fetch(`${this.baseURL}/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = 'Token invalid';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    async getUsers() {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${this.baseURL}/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to fetch users';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            // Handle network errors
            if (error.message === 'Failed to fetch' || 
                (error.name === 'TypeError' && error.message.includes('fetch')) ||
                error.message.includes('NetworkError') ||
                error.message.includes('Network request failed')) {
                throw new Error('Unable to connect to auth service. Please make sure the backend service is running on port 5000.');
            }
            throw error;
        }
    }
}

const authService = new AuthService();
