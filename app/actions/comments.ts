"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { addComment, toggleReaction, adminHideComment } from "@/lib/comments";

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function submitComment(formData: FormData) {
  const postSlug = String(formData.get("postSlug") || "");
  const parentId = (formData.get("parentId") as string) || null;
  const authorName = String(formData.get("authorName") || "");
  const body = String(formData.get("body") || "");
  const honeypot = String(formData.get("website") || ""); // 숨김 honeypot 필드명

  const result = await addComment({
    postSlug,
    parentId: parentId || null,
    authorName,
    body,
    honeypot,
    ip: await clientIp(),
  });
  if (result.ok) revalidatePath(`/blog/${postSlug}`);
  return result;
}

export async function reactToComment(commentId: string, emoji: string, reactorKey: string, postSlug: string) {
  const result = await toggleReaction({ commentId, emoji, reactorKey });
  if (result.ok) revalidatePath(`/blog/${postSlug}`);
  return result;
}

export async function hideComment(commentId: string, token: string, postSlug: string) {
  const result = await adminHideComment(commentId, token);
  if (result.ok) revalidatePath(`/blog/${postSlug}`);
  return result;
}
