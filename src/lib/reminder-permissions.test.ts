import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// Integration tests use the requesting user's managed session, never a stored credential.
const sessionText = process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON;
const integration = sessionText ? test : test.skip;
const session = JSON.parse(sessionText || "null");
const payload = session ? JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64url").toString()) : null;
const origin = payload ? new URL(payload.iss).origin : "";
const publishableKey = readFileSync(".env", "utf8").match(/VITE_SUPABASE_PUBLISHABLE_KEY=["']?([^"'\n]+)/)?.[1];
const rpc = (token?: string) => fetch(`${origin}/rest/v1/rpc/book_reminder_programmes`, {
  method: "POST", headers: { "Content-Type": "application/json", ...(publishableKey ? { apikey: publishableKey } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: "{}",
});
integration("unsigned requests cannot retrieve firm reminder programme metadata", async () => {
  const response = await rpc();
  expect(response.ok).toBe(false);
});
integration("reminder metadata never returns participant identities, responses or notes", async () => {
  const response = await rpc(session.access_token);
  expect(response.ok).toBe(true);
  const rows = await response.json() as Record<string, unknown>[];
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) expect(Object.keys(row).sort()).toEqual(["chapter_dates", "id", "join_code", "name"]);
});
test("only global admins can change coordinator assignments and coordinators see only their own assignments", async () => {
  const result = Bun.spawn(["lovable", "supabase", "query", "SELECT policyname, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='book_reminder_coordinators' ORDER BY policyname", "--json"], { stdout: "pipe", stderr: "pipe" });
  const output = await new Response(result.stdout).text();
  expect(await result.exited).toBe(0);
  expect(output).toContain("has_role(auth.uid(), 'admin'");
  expect(output).toContain("assigned_by = auth.uid()");
  expect(output).toContain("user_id = auth.uid()");
});
test("coordinators receive only their assigned active programmes", async () => {
  const result = Bun.spawn(["lovable", "supabase", "query", "SELECT pg_get_functiondef('public.book_reminder_programmes()'::regprocedure) AS definition", "--json"], { stdout: "pipe", stderr: "pipe" });
  const output = await new Response(result.stdout).text();
  expect(await result.exited).toBe(0);
  expect(output).toContain("p.status = 'active'");
  expect(output).toContain("c.program_id = p.id AND c.user_id = auth.uid()");
});
