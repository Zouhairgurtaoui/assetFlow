(() => {
    const sections = {
        dashboard: document.getElementById('section-dashboard'),
        assets: document.getElementById('section-assets'),
        users: document.getElementById('section-users'),
    };
    const usersNavLink = document.getElementById('usersNavLink');
    const roleBadge = document.getElementById('roleBadge');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const rightSidebar = document.getElementById('rightSidebar');
    const activityList = document.getElementById('activityList');

    // Sidebar toggle
    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        document.body.classList.toggle('sidebar-open');
    });

    // Nav switching
    document.querySelectorAll('a.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.dataset.section;
            document.querySelectorAll('a.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            Object.values(sections).forEach(s => s.classList.add('d-none'));
            document.getElementById(id).classList.remove('d-none');
            if (id === 'section-assets') renderAssetsTable();
            if (id === 'section-users') renderUsersTable();
            // Toggle right activity sidebar only on dashboard for Admin
            const role = getRoleFromToken();
            if (id === 'section-dashboard' && role === 'Admin') {
                rightSidebar?.classList.remove('d-none');
                document.body.classList.add('with-right-sidebar');
                fetchAndRenderActivity();
            } else {
                rightSidebar?.classList.add('d-none');
                document.body.classList.remove('with-right-sidebar');
            }
        });
    });

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(jsonPayload);
        } catch { return null; }
    }

    function getRoleFromToken() {
        const token = authService.getToken();
        const payload = token ? parseJwt(token) : null;
        return payload?.role || null;
    }

    function initAuthUI() {
        const token = authService.getToken();
        const payload = token ? parseJwt(token) : null;
        if (!token || !payload) {
            window.location.href = 'index.html';
            return;
        }
        userInfo.textContent = `Signed in as ${payload.username}`;
        roleBadge.textContent = payload.role || 'Unknown';
        // Adjust right sidebar top offset under navbar
        const navbar = document.querySelector('.navbar');
        const setSidebarTop = () => {
            if (rightSidebar && navbar) {
                rightSidebar.style.top = navbar.offsetHeight + 'px';
            }
        };
        setSidebarTop();
        window.addEventListener('resize', setSidebarTop);
        if (payload.role === 'Admin') {
            usersNavLink.style.display = '';
            // Only show on initial load if dashboard section is active
            const dashboardVisible = !sections.dashboard.classList.contains('d-none');
            if (dashboardVisible) {
                rightSidebar?.classList.remove('d-none');
                document.body.classList.add('with-right-sidebar');
                fetchAndRenderActivity();
            }
        }
    }

    logoutBtn.addEventListener('click', () => {
        authService.logout();
    });

    let assets = [];
    let selectedAssetId = null;
    function isAssigned(a) {
        if (a == null) return false;
        const uid = a.user_id;
        // Treat > 0 as assigned; handle numeric, string, null/undefined gracefully
        const n = typeof uid === 'string' ? Number(uid) : uid;
        return typeof n === 'number' && Number.isFinite(n) && n > 0;
    }
    
    function isAssetAvailable(a) {
        // Prefer assignment signal; if assigned, it's not available
        if (isAssigned(a)) return false;
        const v = a?.is_available;
        return v === true || v === 1 || v === 'true' || v === 'True' || v === 'TRUE';
    }

    let usersCache = [];
    let userIdToName = new Map();
    let charts = { byCategory: null, availability: null };
    let activityTimer = null;

    async function loadAssets() {
        assets = await assetService.getAssets();
        updateKPIs();
        renderCharts();
    }

    async function loadUsersCache() {
        try {
            usersCache = await authService.getUsers();
            userIdToName = new Map(usersCache.map(u => [String(u.id), u.username]));
        } catch (e) {
            // ignore cache failure; show IDs instead
            usersCache = [];
            userIdToName = new Map();
        }
    }

    function updateKPIs() {
        const total = assets.length;
        const assigned = assets.filter(a => isAssigned(a) || !isAssetAvailable(a)).length;
        const available = total - assigned;
        const categories = new Set(assets.map(a => a.category)).size;
        document.getElementById('kpiTotal').textContent = total;
        document.getElementById('kpiAvailable').textContent = available;
        document.getElementById('kpiAssigned').textContent = assigned;
        document.getElementById('kpiCategories').textContent = categories;
    }

    function renderCharts() {
        const byCat = assets.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {});
        const catLabels = Object.keys(byCat);
        const catData = Object.values(byCat);

        const ctxCat = document.getElementById('chartByCategory').getContext('2d');
        charts.byCategory?.destroy();
        charts.byCategory = new Chart(ctxCat, {
            type: 'bar',
            data: { labels: catLabels, datasets: [{ label: 'Assets', data: catData, borderWidth: 1, backgroundColor: 'rgba(13,110,253,0.2)', borderColor: 'rgba(13,110,253,1)'}]},
            options: { maintainAspectRatio: false, responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });

        const assigned = assets.filter(a => isAssigned(a) || !isAssetAvailable(a)).length;
        const available = assets.length - assigned;
        const ctxAvail = document.getElementById('chartAvailability').getContext('2d');
        charts.availability?.destroy();
        charts.availability = new Chart(ctxAvail, {
            type: 'doughnut',
            data: { labels: ['Available', 'Assigned'], datasets: [{ data: [available, assigned], backgroundColor: ['#198754', '#fd7e14'] }]},
            options: { maintainAspectRatio: false, responsive: true }
        });
    }

    function renderAssetsTable() {
        const tbody = document.getElementById('assetsTableBody');
        tbody.innerHTML = '';
        assets.forEach(a => {
            const tr = document.createElement('tr');
            const availableFlag = isAssetAvailable(a);
            tr.innerHTML = `
                <td>${a.id}</td>
                <td><span class="text-muted">${a.serial_number ?? '-'}</span></td>
                <td>
                    <div class="fw-semibold">${a.name}</div>
                    <div class="text-muted small">${a.description ? a.description : ''}</div>
                </td>
                <td><span class="badge bg-light text-dark">${a.category}</span></td>
                <td>${availableFlag ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-warning text-dark">No</span>'}</td>
                <td>${isAssigned(a) ? (userIdToName.get(String(a.user_id)) || a.user_id) : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="${a.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${a.id}">Delete</button>
                    ${availableFlag ? `<button class="btn btn-sm btn-outline-primary ms-1" data-action="assign" data-id="${a.id}">Assign</button>` : `<button class="btn btn-sm btn-outline-success ms-1" data-action="release" data-id="${a.id}">Release</button>`}
                    
                </td>
            `;
            tr.addEventListener('click', () => {
                selectedAssetId = a.id;
                const btn = document.getElementById('viewLogsBtn');
                if (btn) btn.disabled = false;
            });
            tbody.appendChild(tr);
        });
    }

    document.getElementById('refreshAssetsBtn')?.addEventListener('click', async () => {
        await loadAssets();
        renderAssetsTable();
    });

    document.getElementById('refreshActivityBtn')?.addEventListener('click', fetchAndRenderActivity);

    // Asset modal handlers (lazy create to avoid bootstrap timing issues)
    const assetModalEl = document.getElementById('assetModal');
    function getAssetModal() {
        if (!assetModalEl || !window.bootstrap) return null;
        const existing = window.bootstrap.Modal.getInstance(assetModalEl);
        return existing || new window.bootstrap.Modal(assetModalEl);
    }
    const assetIdEl = document.getElementById('assetId');
    const assetSerialEl = document.getElementById('assetSerial');
    const assetNameEl = document.getElementById('assetName');
    const assetDescEl = document.getElementById('assetDescription');
    const assetCatEl = document.getElementById('assetCategory');
    const assetAvailEl = document.getElementById('assetIsAvailable');
    const assetModalTitle = document.getElementById('assetModalTitle');

    function openAddAssetModal() {
        const assetModal = getAssetModal();
        if (!assetModal) return;
        assetModalTitle.textContent = 'Add Asset';
        assetIdEl.value = '';
        assetSerialEl.value = '';
        assetNameEl.value = '';
        assetDescEl.value = '';
        assetCatEl.value = '';
        assetAvailEl.checked = true;
        assetModal.show();
    }

    function openEditAssetModal(asset) {
        const assetModal = getAssetModal();
        if (!assetModal) return;
        assetModalTitle.textContent = 'Edit Asset';
        assetIdEl.value = asset.id;
        assetSerialEl.value = asset.serial_number || '';
        assetNameEl.value = asset.name || '';
        assetDescEl.value = asset.description || '';
        assetCatEl.value = asset.category || '';
        assetAvailEl.checked = !!asset.is_available;
        assetModal.show();
    }

    document.getElementById('addAssetBtn')?.addEventListener('click', openAddAssetModal);

    document.getElementById('saveAssetBtn')?.addEventListener('click', async () => {
        const payload = {
            serial_number: assetSerialEl.value || null,
            name: assetNameEl.value,
            description: assetDescEl.value,
            category: assetCatEl.value,
            is_available: assetAvailEl.checked,
        };
        try {
            const id = assetIdEl.value;
            if (id) {
                await assetService.updateAsset(id, payload);
            } else {
                await assetService.addAsset(payload);
            }
            const assetModal = getAssetModal();
            assetModal?.hide();
            await loadAssets();
            renderAssetsTable();
        } catch (err) {
            alert(err.message || 'Failed to save asset');
        }
    });

    // Assets actions in table
    document.getElementById('assetsTableBody')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const asset = assets.find(x => String(x.id) === String(id));
        try {
            if (action === 'edit') {
                openEditAssetModal(asset);
            } else if (action === 'delete') {
                if (!confirm('Delete this asset?')) return;
                await assetService.deleteAsset(id);
                await loadAssets();
                renderAssetsTable();
            } else if (action === 'assign') {
                openAssignModal(id);
            } else if (action === 'release') {
                if (!confirm('Release this asset assignment?')) return;
                await assetService.releaseAsset(id);
                await loadAssets();
                renderAssetsTable();
            } else if (action === 'logs') {
                selectedAssetId = id;
                await openLogsModal();
            }
        } catch (err) {
            alert(err.message || 'Operation failed');
        }
    });

    // Assign modal handlers
    const assignModalEl = document.getElementById('assignModal');
    function getAssignModal() {
        if (!assignModalEl || !window.bootstrap) return null;
        const existing = window.bootstrap.Modal.getInstance(assignModalEl);
        return existing || new window.bootstrap.Modal(assignModalEl);
    }
    const assignAssetIdEl = document.getElementById('assignAssetId');
    const assignUserIdEl = document.getElementById('assignUserId');

    async function openAssignModal(assetId) {
        const assignModal = getAssignModal();
        if (!assignModal) return;
        assignAssetIdEl.value = assetId;
        // Load users
        assignUserIdEl.innerHTML = '<option value="">Select a user…</option>';
        try {
            const users = await authService.getUsers();
            users.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = `${u.username} (${u.role})`;
                assignUserIdEl.appendChild(opt);
            });
        } catch (e) {
            alert(e.message || 'Failed to load users');
        }
        assignModal.show();
    }

    document.getElementById('assignAssetBtn')?.addEventListener('click', async () => {
        const assetId = assignAssetIdEl.value;
        const userId = assignUserIdEl.value;
        if (!userId) { alert('Select a user'); return; }
        try {
            await assetService.assignAsset(assetId, Number(userId));
            const assignModal = getAssignModal();
            assignModal?.hide();
            await loadAssets();
            renderAssetsTable();
        } catch (err) { alert(err.message || 'Failed to assign'); }
    });

    // Logs
    async function openLogsModal() {
        if (!selectedAssetId) return;
        try {
            const token = authService.getToken();
            const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
            const res = await fetch(`http://${host}:8000/assets/${selectedAssetId}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const logs = await res.json();
            const tbody = document.getElementById('logsTableBody');
            tbody.innerHTML = '';
            logs.forEach(l => {
                const tr = document.createElement('tr');
                const by = l.performed_by_user_id ? (userIdToName.get(String(l.performed_by_user_id)) || l.performed_by_user_id) : '-';
                const from = l.from_user_id ? (userIdToName.get(String(l.from_user_id)) || l.from_user_id) : '-';
                const to = l.to_user_id ? (userIdToName.get(String(l.to_user_id)) || l.to_user_id) : '-';
                tr.innerHTML = `
                    <td>${new Date(l.created_at).toLocaleString()}</td>
                    <td><span class="badge bg-light text-dark">${l.action}</span></td>
                    <td>${by}</td>
                    <td>${from}</td>
                    <td>${to}</td>
                    <td>${l.details || ''}</td>
                `;
                tbody.appendChild(tr);
            });
            const modalEl = document.getElementById('logsModal');
            const modal = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
            modal.show();
        } catch (e) {
            alert('Failed to load logs');
        }
    }

    document.getElementById('viewLogsBtn')?.addEventListener('click', openLogsModal);

    function activityColor(action) {
        switch ((action || '').toLowerCase()) {
            case 'created': return 'create';
            case 'updated': return 'updated';
            case 'assigned': return 'assigned';
            case 'released': return 'released';
            case 'deleted': return 'deleted';
            default: return 'updated';
        }
    }

    async function fetchAndRenderActivity() {
        const token = authService.getToken();
        const host = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
        try {
            const res = await fetch(`http://${host}:8000/assets/logs?limit=50`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return;
            const logs = await res.json();
            activityList.innerHTML = '';
            logs.forEach(l => {
                const dot = activityColor(l.action);
                const by = l.performed_by_user_id ? (userIdToName.get(String(l.performed_by_user_id)) || l.performed_by_user_id) : '-';
                const el = document.createElement('div');
                el.className = 'activity-item';
                el.innerHTML = `
                    <div class="activity-dot ${dot}"></div>
                    <div>
                        <div class="activity-title text-capitalize">${l.action} • Asset #${l.asset_id}</div>
                        <div class="activity-meta">${new Date(l.created_at).toLocaleString()} • by ${by}</div>
                    </div>
                `;
                el.addEventListener('click', () => { selectedAssetId = l.asset_id; openLogsModal(); });
                activityList.appendChild(el);
            });
            // Start polling every 15s
            if (activityTimer) clearTimeout(activityTimer);
            activityTimer = setTimeout(fetchAndRenderActivity, 15000);
        } catch {}
    }

    async function renderUsersTable() {
        const role = getRoleFromToken();
        if (role !== 'Admin') return;
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="4" class="text-muted">Loading…</td></tr>';
        try {
            const users = await authService.getUsers();
            tbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td>${u.department || '-'}</td>
                    <td>
                        <select class="form-select form-select-sm" data-user-id="${u.id}">
                            ${['Admin','Assets Manager','HR','Employee'].map(r => `<option value="${r}" ${r===u.role?'selected':''}>${r}</option>`).join('')}
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary" data-action="save" data-user-id="${u.id}">Save</button>
                        <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-user-id="${u.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-danger">${e.message || 'Failed to fetch users'}</td></tr>`;
        }
    }

    document.getElementById('refreshUsersBtn')?.addEventListener('click', renderUsersTable);

    // Save/Delete events
    document.getElementById('usersTableBody')?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const userId = btn.getAttribute('data-user-id');
        const action = btn.getAttribute('data-action');
        try {
            if (action === 'save') {
                const select = document.querySelector(`select[data-user-id="${userId}"]`);
                await updateUserRole(userId, select.value);
            } else if (action === 'delete') {
                if (!confirm('Delete this user?')) return;
                await deleteUser(userId);
            }
            await renderUsersTable();
        } catch (err) {
            alert(err.message || 'Operation failed');
        }
    });

    // Create user
    const createUserForm = document.getElementById('createUserForm');
    createUserForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(createUserForm);
        const payload = { username: fd.get('username'), password: fd.get('password'), role: fd.get('role'), department: fd.get('department') };
        try {
            await authService.register(payload.username, payload.password, payload.role, payload.department);
            createUserForm.reset();
            const modalEl = document.getElementById('createUserModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            renderUsersTable();
        } catch (err) { alert(err.message || 'Failed to create user'); }
    });

    // Backend calls for admin actions
    async function updateUserRole(userId, role) {
        const token = authService.getToken();
        const res = await fetch(`http://localhost:5000/auth/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role })
        });
        if (!res.ok) {
            let msg = 'Failed to update';
            try { const e = await res.json(); msg = e.error || e.message || msg; } catch {}
            throw new Error(msg);
        }
        return res.json();
    }

    async function deleteUser(userId) {
        const token = authService.getToken();
        const res = await fetch(`http://localhost:5000/auth/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            let msg = 'Failed to delete';
            try { const e = await res.json(); msg = e.error || e.message || msg; } catch {}
            throw new Error(msg);
        }
        return res.json();
    }

    (async function init() {
        initAuthUI();
        await Promise.all([loadAssets(), loadUsersCache()]);
        renderAssetsTable();
    })();
})();


