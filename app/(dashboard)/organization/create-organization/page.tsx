import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { useState } from "react";

export default async function CreateOrganizationPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user && (session.user as any).id) ? (session.user as any).id as string : undefined;
  if (!userId) {
    redirect("/sign-in");
    return null;
  }

  async function createOrg(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    if (!name || !userId) return;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    await db.organization.create({
      data: {
        name,
        description,
        slug,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: "ADMIN",
          },
        },
      },
    });
    revalidatePath("/organization");
    redirect("/organization");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form action={createOrg} className="bg-white dark:bg-gray-900 p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Создать организацию</h1>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Название</label>
          <input name="name" required className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">Описание</label>
          <textarea name="description" className="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold">Создать</button>
      </form>
    </div>
  );
} 