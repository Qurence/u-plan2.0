import ImageKit from "imagekit"

// Инициализация ImageKit
export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
})

// Получение токена аутентификации для клиентской загрузки
export async function getImageKitAuthParams() {
  const authenticationParameters = imagekit.getAuthenticationParameters()
  return authenticationParameters
}
