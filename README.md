# StudyHub

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Create an admin account for local testing:

   ```powershell
   $env:ADMIN_EMAIL="admin@example.com"
   $env:ADMIN_PASSWORD="change-this-password"
   node server.js
   ```

4. Open `http://127.0.0.1:3000/login`.

New registrations are stored as `student` users. Students are redirected to `/dashboard`; the configured admin is redirected to `/admin`. The server stores password hashes (scrypt + per-user salt), not plaintext passwords, in the ignored `data/users.json` file. Sessions use random HttpOnly cookies and roles are checked on the server before `/admin` is served.

Password recovery, reviewer uploads, calendar functionality, and calendar notifications are intentionally not implemented yet.
