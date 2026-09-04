import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !publicKey) {
  throw new Error("Missing Supabase environment variables. Run `vercel env pull .env.local --yes` first.");
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const password = `Cfop-${randomUUID()}-9a!`;
const suffix = randomUUID();
const users = [];

async function createTestUser(label) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `cfop-${label}-${suffix}@example.com`,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  users.push(data.user.id);
  return data.user;
}

async function signedInClient(user) {
  const client = createClient(url, publicKey, options);
  const { error } = await client.auth.signInWithPassword({ email: user.email, password });
  if (error) throw error;
  return client;
}

try {
  const userA = await createTestUser("a");
  const userB = await createTestUser("b");
  const clientA = await signedInClient(userA);
  const clientB = await signedInClient(userB);
  const anonymous = createClient(url, publicKey, options);

  const { error: writeError } = await clientA.from("user_learning_state").upsert({
    user_id: userA.id,
    progress: { "oll-27": { status: "mastered" } },
    favorites: { "oll-27": true },
    review_history: ["2026-09-04"],
  });
  assert.equal(writeError, null, "signed-in user should write their own state");

  const { data: ownRows, error: ownReadError } = await clientA
    .from("user_learning_state")
    .select("user_id, progress")
    .eq("user_id", userA.id);
  assert.equal(ownReadError, null);
  assert.equal(ownRows.length, 1, "owner should read their own state");

  const { data: otherRows, error: otherReadError } = await clientB
    .from("user_learning_state")
    .select("user_id")
    .eq("user_id", userA.id);
  assert.equal(otherReadError, null);
  assert.equal(otherRows.length, 0, "another user must not see the owner's state");

  const { error: anonymousError } = await anonymous.from("user_learning_state").select("user_id");
  assert.ok(anonymousError, "signed-out visitors must not read learning state");

  console.log("Supabase verification passed: owner access works; cross-user and anonymous reads are blocked.");
} finally {
  for (const userId of users) {
    await admin.auth.admin.deleteUser(userId);
  }
}
