#!/usr/bin/env bun
/**
 * Apply a SQL migration file to the hosted Supabase project via Management API.
 * Requires SUPABASE_MANAGEMENT_TOKEN (personal access token) and NEXT_PUBLIC_SUPABASE_URL.
 *
 * Usage:
 *   SUPABASE_MANAGEMENT_TOKEN=sbp_... bun scripts/apply-migration-via-management-api.mjs supabase/migrations/20260602140100_repair_custom_access_token_hook_admin.sql
 */
import { readFileSync } from "node:fs";

const migrationPath = process.argv[2];
if (!migrationPath) {
  console.error("Usage: bun scripts/apply-migration-via-management-api.mjs <path-to.sql>");
  process.exit(2);
}

const token =
  process.env.SUPABASE_MANAGEMENT_TOKEN ??
  process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!token || !supabaseUrl) {
  console.error(
    "Missing SUPABASE_MANAGEMENT_TOKEN (or SUPABASE_ACCESS_TOKEN) and/or NEXT_PUBLIC_SUPABASE_URL",
  );
  process.exit(2);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const sql = readFileSync(migrationPath, "utf8");
const migrationName = migrationPath.replace(/^.*\//, "").replace(/\.sql$/, "");

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  },
);

const body = await response.text();
if (!response.ok) {
  console.error(`Management API ${response.status}: ${body}`);
  process.exit(1);
}

console.log(`Applied ${migrationName} to project ${projectRef}`);
console.log(body);
