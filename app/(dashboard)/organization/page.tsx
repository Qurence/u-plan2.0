import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function OrganizationListPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Необходимо войти в систему</p>
        <Link href="/sign-in">
          <Button>Войти</Button>
        </Link>
      </div>
    );
  }

  const organizations = await db.organization.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ваши организации</h1>
      {organizations.length === 0 ? (
        <div className="mb-6">У вас пока нет организаций.</div>
      ) : (
        <ul className="mb-6">
          {organizations.map(org => (
            <li key={org.id} className="mb-2">
              <Link href={`/organization/${org.id}`}>
                <Button variant="outline" className="w-full text-left">{org.name}</Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/organization/create-organization">
        <Button>Создать организацию</Button>
      </Link>
    </div>
  );
} 