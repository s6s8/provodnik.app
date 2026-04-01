"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  addDisputeNote,
  assignDisputeToAdmin,
  resolveDispute,
} from "@/lib/supabase/disputes";

const caseIdSchema = z.string().uuid("Некорректный идентификатор спора.");
const noteSchema = z.string().trim().min(1, "Введите заметку.").max(4_000);
const resolutionSchema = z.string().trim().min(1, "Укажите итоговое решение.").max(4_000);

function parseCaseId(formData: FormData) {
  return caseIdSchema.parse(formData.get("case_id"));
}

export async function assignDisputeToSelfAction(formData: FormData) {
  const caseId = parseCaseId(formData);
  const adminId = z.string().uuid().parse(formData.get("admin_id"));

  await assignDisputeToAdmin(caseId, adminId);
  redirect(`/admin/disputes/${caseId}`);
}

export async function addDisputeNoteAction(formData: FormData) {
  const caseId = parseCaseId(formData);
  const authorId = z.string().uuid().parse(formData.get("author_id"));
  const note = noteSchema.parse(formData.get("note"));
  const internalOnly = formData.get("internal_only") === "true";

  await addDisputeNote(caseId, authorId, note, internalOnly);
  redirect(`/admin/disputes/${caseId}`);
}

export async function resolveDisputeAction(formData: FormData) {
  const caseId = parseCaseId(formData);
  const adminId = z.string().uuid().parse(formData.get("admin_id"));
  const resolutionSummary = resolutionSchema.parse(formData.get("resolution_summary"));

  await resolveDispute(caseId, adminId, resolutionSummary);
  redirect(`/admin/disputes/${caseId}`);
}
