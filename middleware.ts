import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Публичные маршруты
    const publicRoutes = ["/sign-in", "/"]

    if (publicRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Проверяем авторизацию для защищенных маршрутов
    if (!token) {
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    // Проверяем доступ к организации
    if (pathname.startsWith("/organization/")) {
      const organizationId = pathname.split("/")[2]

      // Здесь можно добавить дополнительную проверку доступа к организации
      // Например, запрос к базе данных для проверки членства
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Разрешаем доступ к публичным маршрутам
        if (pathname === "/" || pathname === "/sign-in") {
          return true
        }

        // Для всех остальных маршрутов требуем токен
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
