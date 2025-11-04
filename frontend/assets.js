class AssetService {
    constructor() {
        this.baseURL = 'http://localhost:8000/assets';
    }

    getHeaders() {
        const token = authService.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getAssets(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `${this.baseURL}?${queryParams}` : this.baseURL;
            const response = await fetch(url, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch assets');
            }

            return await response.json();
        } catch (error) {
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
                const error = await response.json();
                throw new Error(error.errors || 'Failed to add asset');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async deleteAsset(assetId) {
        try {
            const response = await fetch(`${this.baseURL}/${assetId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete asset');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async assignAsset(assetId, userId) {
        try {
            const response = await fetch(`${this.baseURL}/assign/${assetId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign asset');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async releaseAsset(assetId) {
        try {
            const response = await fetch(`${this.baseURL}/release/${assetId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to release asset');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

const assetService = new AssetService();
