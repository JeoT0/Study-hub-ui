const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const sessions = new Map();

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]\n", { mode: 0o600 });
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const users = readUsers();
    if (!users.some((user) => user.email === adminEmail)) {
      users.push({ id: crypto.randomUUID(), email: adminEmail, name: "StudyHub Admin", role: "admin", ...hashPassword(adminPassword), createdAt: new Date().toISOString() });
      writeUsers(users);
      console.log(`Provisioned admin account for ${adminEmail}`);
    }
  }
}

function readUsers() {
  try {
    const parsed = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("User database must be an array");
    return parsed;
  } catch (error) {
    throw new Error(`Unable to read user database: ${error.message}`);
  }
}

function writeUsers(users) {
  const tempFile = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), { mode: 0o600 });
  fs.renameSync(tempFile, USERS_FILE);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, passwordHash: crypto.scryptSync(password, salt, 64).toString("hex") };
}

function verifyPassword(password, user) {
  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = crypto.scryptSync(password, user.salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function validateCredentials(body) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8 || password.length > 128) return { error: "Password must be between 8 and 128 characters." };
  return { email, password };
}

function getSession(request) {
  const token = request.headers.cookie?.match(/(?:^|;\s*)studyhub_session=([^;]+)/)?.[1];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return null;
  }
  return session;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("base64url");
  sessions.set(token, { userId: user.id, role: user.role, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(payload));
}

function sendFile(response, fileName) {
  const filePath = path.join(ROOT, fileName);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) return sendJson(response, 404, { error: "Not found." });
  const contentType = fileName.endsWith(".css") ? "text/css; charset=utf-8" : fileName.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8";
  response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
  fs.createReadStream(filePath).pipe(response);
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 10_000) request.destroy(new Error("Request body too large."));
    });
    request.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Request body must be valid JSON.")); }
    });
    request.on("error", reject);
  });
}

function currentUser(request) {
  const session = getSession(request);
  if (!session) return null;
  return readUsers().find((user) => user.id === session.userId) || null;
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || HOST}`);
  const user = currentUser(request);

  if (url.pathname === "/") {
    response.writeHead(302, { Location: user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login" });
    return response.end();
  }
  if (url.pathname === "/dashboard" && !user) {
    response.writeHead(302, { Location: "/login" });
    return response.end();
  }
  if (url.pathname === "/admin" && (!user || user.role !== "admin")) {
    response.writeHead(302, { Location: user ? "/dashboard?error=forbidden" : "/login?next=%2Fadmin" });
    return response.end();
  }
  if (url.pathname === "/login" && user) {
    response.writeHead(302, { Location: user.role === "admin" ? "/admin" : "/dashboard" });
    return response.end();
  }
  if (url.pathname === "/login" || url.pathname === "/dashboard" || url.pathname === "/admin") {
    return sendFile(response, "index.html");
  }

  if (url.pathname === "/api/register" && request.method === "POST") {
    const body = await parseBody(request);
    const credentials = validateCredentials(body);
    if (credentials.error || typeof body.name !== "string" || body.name.trim().length < 2) return sendJson(response, 400, { error: credentials.error || "Enter your name." });
    const users = readUsers();
    if (users.some((item) => item.email === credentials.email)) return sendJson(response, 409, { error: "An account with that email already exists." });
    const userRecord = { id: crypto.randomUUID(), email: credentials.email, name: body.name.trim().slice(0, 80), role: "student", ...hashPassword(credentials.password), createdAt: new Date().toISOString() };
    users.push(userRecord);
    writeUsers(users);
    const token = createSession(userRecord);
    return sendJson(response, 201, { user: { email: userRecord.email, name: userRecord.name, role: userRecord.role } }, { "Set-Cookie": `studyhub_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}` });
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    const body = await parseBody(request);
    const credentials = validateCredentials(body);
    if (credentials.error) return sendJson(response, 400, { error: credentials.error });
    const userRecord = readUsers().find((item) => item.email === credentials.email);
    if (!userRecord || !verifyPassword(credentials.password, userRecord)) return sendJson(response, 401, { error: "Email or password is incorrect." });
    const token = createSession(userRecord);
    return sendJson(response, 200, { user: { email: userRecord.email, name: userRecord.name, role: userRecord.role } }, { "Set-Cookie": `studyhub_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}` });
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    const token = request.headers.cookie?.match(/(?:^|;\s*)studyhub_session=([^;]+)/)?.[1];
    if (token) sessions.delete(token);
    return sendJson(response, 200, { ok: true }, { "Set-Cookie": "studyhub_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
  }

  if (url.pathname === "/api/me" && request.method === "GET") {
    return user ? sendJson(response, 200, { user: { email: user.email, name: user.name, role: user.role } }) : sendJson(response, 401, { error: "Authentication required." });
  }

  if (url.pathname === "/api/forgot-password" && request.method === "POST") {
    return sendJson(response, 501, { error: "Password recovery is not enabled yet. Contact an administrator." });
  }

  if (url.pathname === "/api/admin/overview" && request.method === "GET") {
    if (!user || user.role !== "admin") return sendJson(response, 403, { error: "Administrator access required." });
    return sendJson(response, 200, { users: readUsers().map(({ email, name, role, createdAt }) => ({ email, name, role, createdAt })) });
  }

  if (url.pathname === "/styles.css") return sendFile(response, "styles.css");
  if (url.pathname === "/app.js") return sendFile(response, "app.js");
  if (url.pathname === "/index.html") return sendFile(response, "index.html");
  return sendJson(response, 404, { error: "Not found." });
}

ensureDatabase();
http.createServer((request, response) => {
  handle(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) sendJson(response, 500, { error: "Unexpected server error." });
    else response.destroy();
  });
}).listen(PORT, HOST, () => console.log(`StudyHub running at http://${HOST}:${PORT}`));
