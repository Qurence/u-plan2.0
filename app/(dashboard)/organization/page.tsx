import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Star, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  // Получаем избранные доски
  const favoriteBoards = await db.favoriteBoard.findMany({
    where: {
      userId: userId,
    },
    include: {
      board: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Рабочее пространство</h1>
      
      {/* Избранные доски */}
      {favoriteBoards.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <h2 className="text-xl font-semibold">Избранные доски</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {favoriteBoards.map((favorite) => (
              <Link key={favorite.id} href={`/board/${favorite.board.id}`}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 px-4 flex items-start justify-between hover:bg-accent"
                >
                  <div className="flex items-start gap-3 flex-1 text-left">
                    <LayoutDashboard className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{favorite.board.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {favorite.board.organization.name}
                      </div>
                    </div>
                  </div>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0 ml-2" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Организации */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6">Ваши организации</h2>
        {organizations.length === 0 ? (
          <div className="text-muted-foreground">У вас пока нет организаций.</div>
        ) : (
          <ul>
            {organizations.map(org => (
              <li key={org.id} className="mb-2">
                <Link href={`/organization/${org.id}`}>
                  <Button variant="outline" className="w-full justify-start h-12 text-lg px-6 font-medium">
                    {org.name}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/organization/create-organization">
        <Button size="lg">Создать организацию</Button>
      </Link>
    </div>
  );
} 