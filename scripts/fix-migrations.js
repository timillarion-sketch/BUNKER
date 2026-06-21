const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

const dir = "/app/lib/db/drizzle";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf8");
  const hash = createHash("sha256").update(content).digest("hex");
  console.log("DELETE FROM _drizzle_migrations WHERE hash = '" + hash + "';");
  console.log("INSERT INTO _drizzle_migrations (hash, created_at) VALUES ('" + hash + "', EXTRACT(EPOCH FROM NOW())::BIGINT);");
}
