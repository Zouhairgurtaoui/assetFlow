//assets.js
class AssetService {
    constructor() {
        // Use the same host as the frontend to avoid CORS/hostname issues
        const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
        // Use /assets/ with trailing slash to match Flask route exactly
        this.baseURL = `http://${host}:8000/assets/`;
        console.log('AssetService initialized with baseURL:', this.baseURL);
    }

    getHeaders() {
        const token = authService.getToken();
        if (!token) {
            console.error('No token available for asset request');
            throw new Error('Authentication required. Please login again.');
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getAssets(filters = {}) {
        try {
            // Check token first
            const token = authService.getToken();
            if (!token) {
                throw new Error('No authentication token. Please login again.');
            }
            
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `${this.baseURL}?${queryParams}` : this.baseURL;
            
            console.log('Fetching assets from:', url);
            const headers = this.getHeaders();
            console.log('Request headers:', { ...headers, 'Authorization': 'Bearer ***' });
            
            console.log('Making fetch request to:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                cache: 'no-cache',
            });
            
            console.log('Response received:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = 'Failed to fetch assets';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Assets loaded successfully:', data);
            return data;
        } catch (error) {
            console.error('Fetch error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Handle network errors (CORS, connection refused, etc.)
            if (error.message === 'Failed to fetch' || 
                error.name === 'TypeError' ||
                error.message.includes('NetworkError') ||
                error.message.includes('Network request failed') ||
                error.message.includes('fetch')) {
                throw new Error('Unable to connect to asset service. Please make sure the backend service is running on port 8000. Error: ' + error.message);
            }
            throw error;
        }
    }

    async addAsset(assetData) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(assetData),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to add asset';
                try {
                    const error = await response.json();
                    // Handle different error formats
                    if (error.errors) {
                        // Marshmallow validation errors
                        errorMessage = typeof error.errors === 'string' ? error.errors : JSON.stringify(error.errors);
                    } else if (error.error) {
                        errorMessage = error.error;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
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
                throw new Error('Unable to connect to asset service. Please make sure the backend service is running on port 8000.');
            }
            throw error;
        }
    }

    async deleteAsset(assetId) {
        try {
            const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
            const response = await fetch(`${baseUrl}/${assetId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete asset';
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
                throw new Error('Unable to connect to asset service. Please make sure the backend service is running on port 8000.');
            }
            throw error;
        }
    }

    async assignAsset(assetId, userId) {
        try {
            // Remove trailing slash from baseURL if present, then add path
            const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
            const response = await fetch(`${baseUrl}/assign/${assetId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to assign asset';
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
                throw new Error('Unable to connect to asset service. Please make sure the backend service is running on port 8000.');
            }
            throw error;
        }
    }

    async releaseAsset(assetId) {
        try {
            // Remove trailing slash from baseURL if present, then add path
            const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
            const response = await fetch(`${baseUrl}/release/${assetId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to release asset';
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
                throw new Error('Unable to connect to asset service. Please make sure the backend service is running on port 8000.');
            }
            throw error;
        }
    }

    async updateAsset(assetId, assetData) {
        try {
            // Remove trailing slash from baseURL if present, then add assetId
            const baseUrl = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
            const response = await fetch(`${baseUrl}/${assetId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(assetData),
            });

            if (!response.ok) {
                let errorMessage = 'Failed to update asset';
                try {
                    const error = await response.json();
                    // Handle different error formats
                    if (error.errors) {
                        errorMessage = typeof error.errors === 'string' ? error.errors : JSON.stringify(error.errors);
                    } else if (error.error) {
                        errorMessage = error.error;
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
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
                throw new Error('Unable to connect to asset service. Please make sure the backend service is running on port 8000.');
            }
            throw error;
        }
    }
}

const assetService = new AssetService();
