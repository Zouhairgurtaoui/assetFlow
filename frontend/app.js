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
            // Validate token first
            const token = authService.getToken();
            if (!token) {
                console.error('No token found, redirecting to login');
                authService.logout();
                return;
            }
            
            console.log('Validating token...');
            const userData = await authService.validateToken();
            console.log('Token validated, user data:', userData);
            
            currentUser = userData;
            // Display user info - validate endpoint returns: {message, user, role}
            const role = userData.role || 'User';
            const username = userData.username || `User ${userData.user || ''}`;
            document.getElementById('userInfo').textContent = `Welcome, ${role} (ID: ${userData.user || 'N/A'})`;
            
            // Load assets after token validation
            console.log('Loading assets...');
            await loadAssets();
        } catch (error) {
            console.error('Error in page load:', error);
            showMessage('Session expired. Please login again.', 'warning');
            setTimeout(() => {
                authService.logout();
            }, 2000);
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        authService.logout();
    });

    // Load assets
    async function loadAssets() {
        try {
            // Check if user is authenticated before loading assets
            if (!authService.isAuthenticated()) {
                showMessage('Please login to view assets', 'warning');
                return;
            }
            
            const assets = await assetService.getAssets();
            const tbody = document.getElementById('assetsTableBody');
            tbody.innerHTML = '';

            if (assets && assets.length > 0) {
                assets.forEach(asset => {
                    const row = createAssetRow(asset);
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No assets found</td></tr>';
            }
        } catch (error) {
            console.error('Error loading assets:', error);
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

        // Ensure currentUser exists and has role
        if (!currentUser || !currentUser.role) {
            return buttons;
        }

        if (['Admin', 'Assets Manager'].includes(currentUser.role)) {
            buttons += `<button class="btn btn-sm btn-warning me-1" onclick="editAsset(${asset.id})">Edit</button>`;
            buttons += `<button class="btn btn-sm btn-danger me-1" onclick="deleteAsset(${asset.id})">Delete</button>`;
        }

        if (['Admin', 'HR'].includes(currentUser.role) && asset.is_available) {
            buttons += `<button class="btn btn-sm btn-info me-1" onclick="assignAsset(${asset.id})">Assign</button>`;
        }

        // Ensure user ID comparison is correct - both should be integers
        // Admin can release any asset, Employee can only release their own
        if (['Admin', 'Employee'].includes(currentUser.role) && !asset.is_available) {
            const currentUserId = currentUser.user ? parseInt(currentUser.user) : null;
            const assetUserId = asset.user_id ? parseInt(asset.user_id) : null;
            // Admin can release any assigned asset, Employee can only release their own
            if (currentUser.role === 'Admin' || (currentUserId !== null && assetUserId === currentUserId)) {
                buttons += `<button class="btn btn-sm btn-success" onclick="releaseAsset(${asset.id})">Release</button>`;
            }
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
        document.getElementById('assetIsAvailable').checked = true; // New assets are available by default
        document.getElementById('assetIsAvailable').disabled = false;
    });

    document.getElementById('saveAssetBtn').addEventListener('click', async () => {
        const assetId = document.getElementById('assetId').value;
        const assetData = {
            name: document.getElementById('assetName').value,
            description: document.getElementById('assetDescription').value,
            category: document.getElementById('assetCategory').value,
        };
        
        // Only include is_available if editing (assetId exists)
        if (assetId) {
            assetData.is_available = document.getElementById('assetIsAvailable').checked;
        }

        try {
            if (assetId) {
                // Update existing asset
                await assetService.updateAsset(assetId, assetData);
                showMessage('Asset updated successfully', 'success');
                loadAssets();
                // Reset form and close modal
                document.getElementById('assetForm').reset();
                const modalElement = document.getElementById('assetModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    // Remove aria-hidden before hiding to fix accessibility warning
                    modalElement.removeAttribute('aria-hidden');
                    modalInstance.hide();
                }
            } else {
                // Add new asset
                await assetService.addAsset(assetData);
                showMessage('Asset added successfully', 'success');
                loadAssets();
                // Reset form and close modal
                document.getElementById('assetForm').reset();
                const modalElement = document.getElementById('assetModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    // Remove aria-hidden before hiding to fix accessibility warning
                    modalElement.removeAttribute('aria-hidden');
                    modalInstance.hide();
                }
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
    window.assignAsset = async (assetId) => {
        document.getElementById('assignAssetId').value = assetId;
        const userIdSelect = document.getElementById('assignUserId');
        
        // Load users for the dropdown
        try {
            const users = await authService.getUsers();
            userIdSelect.innerHTML = '<option value="">Select a user...</option>';
            
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.username} (${user.role})`;
                userIdSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load users:', error);
            showMessage('Failed to load users. Please try again.', 'warning');
            // Still show modal but with empty dropdown
            userIdSelect.innerHTML = '<option value="">Failed to load users</option>';
        }
        
        // Reset selection
        userIdSelect.value = '';
        new bootstrap.Modal(document.getElementById('assignModal')).show();
    };

    document.getElementById('assignAssetBtn').addEventListener('click', async () => {
        const assetId = document.getElementById('assignAssetId').value;
        const userId = document.getElementById('assignUserId').value;

        try {
            await assetService.assignAsset(assetId, parseInt(userId));
            showMessage('Asset assigned successfully', 'success');
            loadAssets();
                // Reset form and close modal
                document.getElementById('assignForm').reset();
                const modalElement = document.getElementById('assignModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    // Remove aria-hidden before hiding to fix accessibility warning
                    modalElement.removeAttribute('aria-hidden');
                    modalInstance.hide();
                }
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

    // Edit asset
    window.editAsset = async (assetId) => {
        try {
            // Load all assets to find the one to edit
            const assets = await assetService.getAssets();
            const asset = assets.find(a => a.id === parseInt(assetId));
            
            if (!asset) {
                showMessage('Asset not found', 'danger');
                return;
            }

            // Populate the form with asset data
            document.getElementById('assetModalTitle').textContent = 'Edit Asset';
            document.getElementById('assetId').value = asset.id;
            document.getElementById('assetName').value = asset.name || '';
            document.getElementById('assetDescription').value = asset.description || '';
            document.getElementById('assetCategory').value = asset.category || '';
            document.getElementById('assetIsAvailable').checked = asset.is_available || false;
            document.getElementById('assetIsAvailable').disabled = false; // Enable the checkbox for editing

            // Show the modal
            const modalElement = document.getElementById('assetModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } catch (error) {
            showMessage('Failed to load asset for editing: ' + error.message, 'danger');
        }
    };
}
