**Project**
- **Name**: Medicine Reminder System (HTTP server + simple web UI)
- **Location**: `medicine_reminder_server.exe` (project root) and source in `src/`

**Quick Start**
- **Run existing executable**: From project root in PowerShell:

```powershell
cd "d:\NIBM\HNDSE-2ND-Sem\PDSA\InsightBot"
.\medicine_reminder_server.exe
```
- **Open UI**: Visit `http://localhost:5000` in your browser.
 # MedLogix — Medicine Reminder System

Lightweight C++ HTTP server with a simple web UI to manage medicines, categories, reminders and stock. The server is implemented as a single self-contained executable (prebuilt `medicine_reminder_server.exe`) and the full source is in the `src/` folder.

**Repository layout**
- `medicine_reminder_server.exe` — optional prebuilt server in project root (can be removed from repo history; see "Repository cleanup" below)
- `src/` — C++ source files and `public/` static UI
  - `src/main.cpp` — HTTP server + request routing
  - `src/MedicineReminderSystem.cpp` / `.h` — core app logic (categories, medicines, reminders, stock)
  - `src/public/` — static frontend (`index.html`, `script.js`, `style.css`) and `V1/`, `V2/` variants

**What this does**
- Manage categories and medicines
- Schedule reminders and mark doses taken
- Track stock levels and low-stock alerts
- Simple web UI for local testing and demos

**Quick Start (run the prebuilt executable)**
1. Open PowerShell and change to the project directory:

```powershell
cd "d:\NIBM\HNDSE-2ND-Sem\PDSA\InsightBot"
```
2. Start the server (from project root):

```powershell
.\medicine_reminder_server.exe
```
3. Open the UI in your browser: `http://localhost:5000`

Note: the server serves static files relative to the working directory. If you get a "File not found" error for `index.html`, start the executable from the `src` directory so `public/` is found:

```powershell
cd "d:\NIBM\HNDSE-2ND-Sem\PDSA\InsightBot\src"
..\medicine_reminder_server.exe
```

--

**Build from source (Windows / MinGW-w64 g++)**
1. Install MinGW-w64 and ensure `g++` is on `PATH`.
2. Build from `src/`:

```powershell
cd "d:\NIBM\HNDSE-2ND-Sem\PDSA\InsightBot\src"
g++ main.cpp MedicineReminderSystem.cpp -o "..\medicine_reminder_server.exe" -lws2_32
cd ..
.\medicine_reminder_server.exe
```

**Build with MSVC (Developer Command Prompt)**

```powershell
cl /EHsc src\main.cpp src\MedicineReminderSystem.cpp /link ws2_32.lib /OUT:medicine_reminder_server.exe
.\medicine_reminder_server.exe
```

**Build on Linux / macOS (POSIX systems)**
- The code contains Windows-specific sockets (WinSock) and will likely need changes to compile on POSIX systems. If you port or provide a POSIX build, include `-pthread` and adapt socket calls. For local development on Windows, prefer MinGW-w64 or MSVC.

--

**Running & debugging**
- Server listens on port `5000` by default. Change the port in `src/main.cpp` (`address.sin_port = htons(5000);`) and rebuild to use another port.
- Use the browser DevTools network tab to inspect requests to `/api/*` and responses.
- Add temporary `std::cout` lines in `main.cpp` or `MedicineReminderSystem.cpp` to log incoming requests and actions.

**API Reference (common endpoints)**
Base URL: `http://localhost:5000`

Notes: endpoints that modify state use `POST` and expect URL-encoded form data (or simple request body parsing implemented by the server). The server's implementation supports many convenience endpoints — this is a representative list:

- `GET /api/status`
  - Returns basic server status and available features.
- `GET /api/categories`
  - Lists category names.
- `POST /api/add_category`
  - Body: `category=NAME`
- `POST /api/remove_category`
  - Body: `category=NAME`
- `GET /api/medicines`
  - Returns all medicines with metadata.
- `POST /api/medicines_by_category`
  - Body: `category=NAME`
- `POST /api/add_medicine`
  - Body: `name=Name&dose=Dose&timings=08:00,20:00&category=Category`
- `POST /api/delete_medicine`
  - Body: `name=Name`
- `POST /api/schedule_reminder`
  - Body: `medicine=Name&time=HH:MM`
- `GET /api/reminders`
  - Lists scheduled reminders.
- `POST /api/delete_reminder`
  - Body: `medicine=Name&time=HH:MM`
- `POST /api/add_medicine_with_stock`
  - Body: `name=Name&dose=Dose&timings=...&category=...&stock=NN&threshold=NN`
- `POST /api/update_stock`
  - Body: `name=Name&quantity=NN`
- `POST /api/decrease_stock`
  - Body: `name=Name&quantity=NN`
- `GET /api/stock_levels`
  - Returns current stock for tracked medicines.
- `GET /api/low_stock_alerts`
  - Returns medicines under the threshold.
- `POST /api/mark_taken`
  - Mark a scheduled reminder taken (body depends on server implementation).
- `POST /api/undo`
  - Undo the last action.
- `GET /api/history`
  - Returns action history.

Example using PowerShell `curl`:

```powershell
# Check server status
curl -Method GET "http://localhost:5000/api/status"

# Add a category
curl -Method POST -Body "category=Vitamins" "http://localhost:5000/api/add_category"
```

--

**Troubleshooting**
- "File not found" or blank page:
  - Start the server from the `src/` folder (so the server can find `public/index.html`), or copy `public/` next to the executable.

- Port already in use:
  - Either stop the process using port `5000` (check with `netstat -a -n -o`) or change the port in `src/main.cpp` and rebuild.

- Firewall prompts on Windows:
  - Allow the app to accept local network connections to test the UI in your browser.

- Build/link errors with `g++` on Windows:
  - Add `-lws2_32` to link WinSock (already included in the example build command).

--

**Repository cleanup & good practices**
- This repository previously included local IDE and cache folders and a built executable. Those are typically unwanted in source control. A recommended `.gitignore` should include:

```
.vscode/
.local/
.ccls-cache/
*.exe
medicine_reminder_server
Thumbs.db
.DS_Store
```

- If you want to remove the binary from the repository history entirely, you can use a history-rewrite tool (for example `git filter-repo`) and then force-push. This is a destructive operation for commit history and collaborators — ask me to prepare the exact commands if you want to proceed.

**Contributing**
- If you make changes, please:
  - Keep the server and UI in sync (API request format <-> front-end calls)
  - Add tests or manual test steps for any new endpoints
  - Open a PR and describe the change and how to test it

**License & contact**
- Add a license file if you want to open-source the project. If this is a school assignment, check your institution's rules before publishing.
- For questions, contact the repository owner or open an issue on the GitHub repo: `https://github.com/Yashmika5/MedLogix`

--

Thank you for using MedLogix. If you'd like, I can:
- Add the `.gitignore` to the repo and push it (I can do this for you now). 
- Rewrite history to remove the prebuilt executable from all commits.
- Add a short changelog or a Dockerfile to make running easier.


