// Global variables
let currentUser = null;

// Utility functions
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

function checkAuth() {
    if (!authService.isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

// Login page functionality
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await authService.login(username, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            showMessage(error.message, 'danger');
        }
    });
}

// Register page functionality
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;

        try {
            await authService.register(username, password, role);
            showMessage('Registration successful! Please login.', 'success');
            document.getElementById('login-tab').click();
        } catch (error) {
            showMessage(error.message, 'danger');
        }
    });
}

// Dashboard functionality
if (document.getElementById('assetsTable')) {
    // Load user info and assets on page load
    window.addEventListener('load', async () => {
        checkAuth();
        try {
            const userData = await authService.validateToken();
            currentUser = userData;
            document.getElementById('userInfo').textContent = `Welcome, ${userData.role}`;
            loadAssets();
        } catch (error) {
            showMessage('Session expired. Please login again.', 'warning');
            authService.logout();
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        authService.logout();
    });

    // Load assets
    async function loadAssets() {
        try {
            const assets = await assetService.getAssets();
            const tbody = document.getElementById('assetsTableBody');
            tbody.innerHTML = '';

            assets.forEach(asset => {
                const row = createAssetRow(asset);
                tbody.appendChild(row);
            });
        } catch (error) {
            showMessage('Failed to load assets: ' + error.message, 'danger');
        }
    }

    function createAssetRow(asset) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.id}</td>
            <td>${asset.name}</td>
            <td>${asset.description || ''}</td>
            <td>${asset.category}</td>
            <td>${asset.is_available ? 'Yes' : 'No'}</td>
            <td>${asset.user_id || 'Unassigned'}</td>
            <td>${createActionButtons(asset)}</td>
        `;
        return row;
    }

    function createActionButtons(asset) {
        let buttons = '';

        if (['Admin', 'Assets Manager'].includes(currentUser.role)) {
            buttons += `<button class="btn btn-sm btn-warning me-1" onclick="editAsset(${asset.id})">Edit</button>`;
            buttons += `<button class="btn btn-sm btn-danger me-1" onclick="deleteAsset(${asset.id})">Delete</button>`;
        }

        if (['Admin', 'HR'].includes(currentUser.role) && asset.is_available) {
            buttons += `<button class="btn btn-sm btn-info me-1" onclick="assignAsset(${asset.id})">Assign</button>`;
        }

        if (['Admin', 'Employee'].includes(currentUser.role) && !asset.is_available && asset.user_id == currentUser.user) {
            buttons += `<button class="btn btn-sm btn-success" onclick="releaseAsset(${asset.id})">Release</button>`;
        }

        return buttons;
    }

    // Add asset functionality
    document.getElementById('addAssetBtn').addEventListener('click', () => {
        document.getElementById('assetModalTitle').textContent = 'Add Asset';
        document.getElementById('assetId').value = '';
        document.getElementById('assetName').value = '';
        document.getElementById('assetDescription').value = '';
        document.getElementById('assetCategory').value = '';
    });

    document.getElementById('saveAssetBtn').addEventListener('click', async () => {
        const assetId = document.getElementById('assetId').value;
        const assetData = {
            name: document.getElementById('assetName').value,
            description: document.getElementById('assetDescription').value,
            category: document.getElementById('assetCategory').value,
        };

        try {
            if (assetId) {
                // Edit functionality (assuming PUT endpoint exists, but backend doesn't have it, so skip for now)
                showMessage('Edit functionality not implemented in backend', 'warning');
            } else {
                await assetService.addAsset(assetData);
                showMessage('Asset added successfully', 'success');
                loadAssets();
                bootstrap.Modal.getInstance(document.getElementById('assetModal')).hide();
            }
        } catch (error) {
            showMessage('Failed to save asset: ' + error.message, 'danger');
        }
    });

    // Delete asset
    window.deleteAsset = async (assetId) => {
        if (confirm('Are you sure you want to delete this asset?')) {
            try {
                await assetService.deleteAsset(assetId);
                showMessage('Asset deleted successfully', 'success');
                loadAssets();
            } catch (error) {
                showMessage('Failed to delete asset: ' + error.message, 'danger');
            }
        }
    };

    // Assign asset
    window.assignAsset = (assetId) => {
        document.getElementById('assignAssetId').value = assetId;
        document.getElementById('assignUserId').value = '';
        new bootstrap.Modal(document.getElementById('assignModal')).show();
    };

    document.getElementById('assignAssetBtn').addEventListener('click', async () => {
        const assetId = document.getElementById('assignAssetId').value;
        const userId = document.getElementById('assignUserId').value;

        try {
            await assetService.assignAsset(assetId, parseInt(userId));
            showMessage('Asset assigned successfully', 'success');
            loadAssets();
            bootstrap.Modal.getInstance(document.getElementById('assignModal')).hide();
        } catch (error) {
            showMessage('Failed to assign asset: ' + error.message, 'danger');
        }
    });

    // Release asset
    window.releaseAsset = async (assetId) => {
        if (confirm('Are you sure you want to release this asset?')) {
            try {
                await assetService.releaseAsset(assetId);
                showMessage('Asset released successfully', 'success');
                loadAssets();
            } catch (error) {
                showMessage('Failed to release asset: ' + error.message, 'danger');
            }
        }
    };

    // Edit asset (placeholder, since backend doesn't have edit endpoint)
    window.editAsset = (assetId) => {
        showMessage('Edit functionality not implemented in backend', 'warning');
    };
}
