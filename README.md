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

**Build from source (g++)**
- Requirements: MinGW-w64 or other `g++` on `PATH`.
- Build command (run from project root or `src`):

```powershell
cd "d:\NIBM\HNDSE-2ND-Sem\PDSA\InsightBot\src"
g++ main.cpp MedicineReminderSystem.cpp -o "..\medicine_reminder_server.exe" -lws2_32
cd ..
.\medicine_reminder_server.exe
```

**Build from source (MSVC / Visual Studio)**
- Open Developer Command Prompt for Visual Studio and run (from project root):

```powershell
cl /EHsc src\main.cpp src\MedicineReminderSystem.cpp /link ws2_32.lib /OUT:medicine_reminder_server.exe
.\medicine_reminder_server.exe
```

**How the server works**
- The server listens on port `5000` (change `address.sin_port = htons(5000);` in `src/main.cpp` if needed).
- It serves static files from `public/` (relative to the working directory where the exe is started). Start the exe with working directory set to `src/` so `public/index.html` is found, or run the exe from the project root only if `public/` is in the same folder as the exe.

**Important paths**
- Source code: `src/main.cpp`, `src/MedicineReminderSystem.cpp`, `src/MedicineReminderSystem.h`
- Static UI: `src/public/index.html`, `src/public/script.js`, `src/public/style.css` (and `V1/`, `V2/` variants)
- Executable (prebuilt): `medicine_reminder_server.exe` (project root)

**API overview**
- Base: `http://localhost:5000`
- Example endpoints (all accept POST form data for operations that modify data):
  - `GET /api/status` — get system status
  - `GET /api/categories` — list categories
  - `POST /api/add_category` — `category=...`
  - `POST /api/remove_category` — `category=...`
  - `GET /api/medicines` — list all medicines
  - `POST /api/medicines_by_category` — `category=...`
  - `POST /api/add_medicine` — `name=...&dose=...&timings=...&category=...`
  - `POST /api/delete_medicine` — `name=...`
  - `POST /api/search_medicine` — `name=...`
  - `POST /api/schedule_reminder` — `medicine=...&time=HH:MM`
  - `GET /api/reminders` — view scheduled reminders
  - `POST /api/delete_reminder` — `medicine=...&time=...`
  - `POST /api/add_medicine_with_stock` — `name=...&dose=...&timings=...&category=...&stock=NN&threshold=NN`
  - `POST /api/update_stock` — `name=...&quantity=NN`
  - `POST /api/decrease_stock` — `name=...&quantity=NN`
  - `GET /api/stock_levels` — view stock levels
  - `GET /api/low_stock_alerts` — low-stock alerts
  - `POST /api/check_stock` — `name=...`
  - `POST /api/mark_taken` — mark current reminder taken
  - `POST /api/undo` — undo last action
  - `GET /api/history` — action history

**Quick API test (curl)**
- Example (PowerShell):

```powershell
curl -Method GET "http://localhost:5000/api/status"
# Add a category
curl -Method POST -Body "category=Vitamins" "http://localhost:5000/api/add_category"
```

**Troubleshooting**
- **"File not found" in browser**: Start the server with working directory set to `src` so the server can find `public/index.html`:

```powershell
cd "d:\NIBM\HNDSE-2ND-Sem\PDSA\InsightBot\src"
..\medicine_reminder_server.exe
```

- **Port in use**: If port `5000` is already occupied, edit `src/main.cpp` to a free port and rebuild.
- **Firewall prompt**: On first run, Windows may prompt to allow the server. Allow it for local testing.
- **g++ link errors**: Ensure `-lws2_32` is provided on Windows. Use MinGW-w64 `g++` or MSVC.

**Development tips**
- Keep `public/` next to the working directory used to start the exe, or change file paths in `main.cpp` to an absolute or alternative relative path during development.
- Use a browser devtools console to see network requests to `/api/...` and debug the front-end.
- Add logging to `main.cpp` or `MedicineReminderSystem.cpp` if you need more verbose diagnostics.


