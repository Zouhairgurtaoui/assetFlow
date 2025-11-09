# AssetFlow – Documentation

A lightweight asset management system with role-based access, elegant dashboard, and audit logs.

- Frontend: Vanilla JS, Bootstrap 5, Chart.js
- Services: Flask microservices
  - AuthService (port 5000): JWT authentication, user management
  - AssetService (port 8000): Assets CRUD, assignment, logsassetFlow/AssetService

## Quick Start
1) Clone the repo
   # ensure the git is installed in your local machine
   ```bash
   git clone 
   ```
3) Install Python deps and run services (from two terminals):

```bash
# create a virtual envirenement
python3 -m venv env .
pip install -r requirements.txt
# In linux
source env/bin/activate
# In Windows
./env/Script/activate
# AuthService
python3 run_auth.py

# AssetService
python3 run_assets.py
```

3) Serve the frontend (e.g., VS Code Live Server or any static server ex: `python3 -m http.server 8080`) from `assetFlow/frontend/`, then open `index.html`.

4) Register an Admin, login, and go to `dashboard.html`.

Notes:
- SQLite DB files are created at:
  - `inctance/susers.db`
  - `inctance/assets.db`
- To reset schemas, delete the DB files and restart services.

---

## Authentication & Roles

- JWT Bearer token returned by `POST /auth/login`
- Roles: `Admin`, `Assets Manager`, `HR`, `Employee`
- Send token in header: `Authorization: Bearer <token>`

Capabilities:
- Admin: Full access; manage users; see activity sidebar
- Assets Manager: Asset CRUD; assign/release; view recent logs feed
- HR: Assign; read assets
- Employee: Read assets; release own asset

---

## AuthService API (port 5000)

Base URL: `http://localhost:5000/auth`

### POST /auth/register
Create a new user.

Request (JSON):
```json
{
  "username": "alice",
  "password": "Pa$$w0rd!",
  "role": "Admin",
  "department": "IT"
}
```
Responses:
- 201: `{ "message": "User registered successfully" }`
- 409: `{ "error": "Username already exists" }`
- 400: Validation error

### POST /auth/login
Obtain an access token.

Request (JSON):
```json
{ "username": "alice", "password": "Pa$$w0rd!" }
```
Response (200):
```json
{ "access_token": "<JWT>" }
```

### POST /auth/validate
Validate token and return identity and role.

Headers: `Authorization: Bearer <JWT>`

Response (200):
```json
{ "message": "Token is valid", "user": 1, "role": "Admin" }
```

### GET /auth/users
List users (Admin and other roles can read; enforced via frontend usage).

Headers: `Authorization`

Response (200):
```json
[
  { "id": 1, "username": "alice", "role": "Admin", "department": "IT" }
]
```

### PUT /auth/users/:id (Admin)
Update user role.

Request (JSON):
```json
{ "role": "HR" }
```
Response (200): `{ "message": "User updated" }`

### DELETE /auth/users/:id (Admin)
Delete a user.

Response (200): `{ "message": "User deleted" }`

### GET /auth/me
Return current user info from JWT claims.

Response (200):
```json
{ "id": 1, "username": "alice", "role": "Admin" }
```

---

## AssetService API (port 8000)

Base URL: `http://localhost:8000/assets`

Asset model:
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "MacBook Pro 14",
  "category": "Computer",
  "is_available": true,
  "user_id": null,
  "serial_number": "SN-001",
  "created_at": "2025-11-06T12:00:00",
  "updated_at": "2025-11-06T12:00:00"
}
```

### GET /assets/
List assets (filters optional).
- Query: `user_id`, `is_available=true|false`

Response (200): `[ Asset, ... ]`

### POST /assets/ (Admin, Assets Manager)
Create asset.

Request (JSON):
```json
{
  "name": "Laptop",
  "description": "MacBook Pro 14",
  "category": "Computer",
  "serial_number": "SN-001",
  "is_available": true
}
```
Response (201): `Asset`

### PUT /assets/:id (Admin, Assets Manager)
Update asset. Partial updates allowed.

Request (JSON examples):
```json
{ "description": "2025 refresh" }
{ "is_available": false }
```
Response (200): `Asset`

### DELETE /assets/:id (Admin, Assets Manager)
Delete asset.

Response (200): `{ "message": "Asset with ID X has been deleted successfully" }`

### PUT /assets/assign/:id (Admin, Assets Manager, HR)
Assign asset to user.

Request (JSON):
```json
{ "user_id": 5 }
```
Response (200): `Asset` (with `is_available=false`, `user_id=5`)

### PUT /assets/release/:id (Admin, Assets Manager, Employee)
Release asset from a user. Employees can release only their own.

Response (200): `Asset` (with `is_available=true`, `user_id=null`)

### GET /assets/:id/logs (All roles)
Get audit logs for an asset.

Response (200):
```json
[
  {
    "id": 10,
    "asset_id": 1,
    "action": "assigned",
    "performed_by_user_id": 1,
    "from_user_id": null,
    "to_user_id": 5,
    "details": "Assigned to user 5",
    "created_at": "2025-11-06T12:10:00"
  }
]
```

### GET /assets/logs?limit=50 (Admin, Assets Manager)
Get recent logs feed across all assets (for the activity sidebar).

---

## Frontend – Files & Components

Location: `assetFlow/frontend/`

- `index.html`: Login/Register page (uses `auth.js`)
- `dashboard.html`: Main UI with:
  - Left sidebar (navigation)
  - Topbar (user info, logout)
  - Dashboard section (KPIs, charts)
  - Assets section (table + modals for add/edit/assign)
  - Users section (Admin only: user table and create user modal)
  - Right activity sidebar (dashboard-only, Admin-only) with live, colored logs
- `styles.css`: Custom styles (tables, sidebars, modals, activity feed)
- `auth.js`: AuthService client (login/register/validate/users)
- `assets.js`: AssetService client (list/add/update/delete/assign/release)
- `dashboard.js`: Page behavior and rendering (charts, tables, modals, activity feed)

### dashboard.js – Key Functions

Rendering & Navigation
- `initAuthUI()`: Validates token, shows/hides Admin-only elements, positions right sidebar
- `renderAssetsTable()`: Renders modern asset table rows with serial, name/description, category badge, availability, assigned user, and actions
- `renderUsersTable()`: Renders users with department and role editor (Admin)
- Tabs: switching toggles visibility of sections and right activity sidebar (dashboard-only)

Data & Charts
- `loadAssets()`: Fetches assets and triggers KPI/chart updates
- `updateKPIs()`: Total, Available, Assigned, Categories
- `renderCharts()`: Bar (by category) and Doughnut (availability) using Chart.js

Modals & Actions
- Asset modal: `openAddAssetModal()`, `openEditAssetModal(asset)`, Save handler calling `addAsset()`/`updateAsset()`
- Assign modal: `openAssignModal(assetId)`, lists users; Assign handler calls `assignAsset()`
- Release/Delete: table action buttons call `releaseAsset()`/`deleteAsset()`
- Logs modal: loads `/assets/:id/logs` and displays a table; modal width adapts to table content

Admin Activity Sidebar (Dashboard only)
- `fetchAndRenderActivity()`: polls `/assets/logs` every 15s (Admin), color-coded items; click to open detailed logs modal

Utilities
- `isAssigned(asset)`, `isAssetAvailable(asset)`: Derive assignment/availability robustly (handles int/bool/string)
- `loadUsersCache()`: Maps `user_id -> username` for UI

### auth.js – Public Methods
- `login(username, password)`: Returns `{access_token}`; stores token in `localStorage`
- `register(username, password, role, department)`
- `logout()`: Clears token and returns to `index.html`
- `getToken()`, `validateToken()`: Token helpers
- `getUsers()`: Returns list of users (id, username, role, department)

### assets.js – Public Methods
- `getAssets(filters)` – optional `{ user_id, is_available }`
- `addAsset(assetData)` – `{ name, description?, category, serial_number?, is_available? }`
- `updateAsset(assetId, assetData)` – partial updates allowed
- `deleteAsset(assetId)`
- `assignAsset(assetId, userId)`
- `releaseAsset(assetId)`

---

## Usage Examples

Curl – Login and get token
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Pa$$w0rd!"}' | jq -r .access_token)
```

Curl – Create asset
```bash
curl -X POST http://localhost:8000/assets/ \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Laptop","category":"Computer","serial_number":"SN-001"}'
```

Curl – Assign asset
```bash
curl -X PUT http://localhost:8000/assets/assign/1 \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"user_id": 5}'
```

JS – Use services in browser console on dashboard
```js
// List assets
assetService.getAssets().then(console.log)

// Add asset
assetService.addAsset({ name: 'Monitor', category: 'Peripherals', serial_number: 'MON-77' })

// Assign
assetService.assignAsset(1, 5)
```

---

## Database & Migrations

- SQLite used for both services; absolute paths in config ensure the right file is used
- To reset schema: stop services, delete DB files, restart
- To migrate in place, use `sqlite3` and run `ALTER TABLE` statements 

---

## Error Handling & Status Codes

- 400 Bad Request – validation/format errors
- 401 Unauthorized – missing/invalid JWT
- 403 Forbidden – role not permitted
- 404 Not Found – resource missing
- 409 Conflict – duplicates (e.g., username)
- 500 Internal Server Error – unhandled exceptions

Frontend surfaces server messages where possible (modals/alerts), and network errors are normalized with user-friendly hints.

---

## Security Notes

- JWT in Authorization header; never expose in URLs
- CORS enabled for development; tighten in production
- Server-side role checks via validated JWT payload (AssetService validates via AuthService `/auth/validate`)
---

## Troubleshooting

- “no such column” on startup: delete DB files to recreate schema
- 401/403 when calling assets: ensure you’re logged in and role permits action
- CORS errors: make sure both services are running on the documented ports


---



