import ImageKit from "imagekit"

// Проверяем наличие переменных окружения
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

// Инициализация ImageKit только если все переменные установлены
export const imagekit: ImageKit | null = publicKey && privateKey && urlEndpoint
  ? new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })
  : null

// Получение токена аутентификации для клиентской загрузки
export async function getImageKitAuthParams() {
  if (!imagekit) {
    throw new Error("ImageKit is not configured. Please set environment variables.")
  }
  const authenticationParameters = imagekit.getAuthenticationParameters()
  return authenticationParameters
}
