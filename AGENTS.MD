CRITICAL RULE FOR EXECUTION PHASE:
DO NOT attempt to start, stop, or restart the Node.js server.
DO NOT run complex PowerShell commands to kill processes (e.g., Get-Process node | Stop-Process).
The user is running a local dev server with hot-reload (npm run dev). You only need to write and save the code. The server will restart automatically.
ONLY run tests or build commands (npm run build) if explicitly asked.