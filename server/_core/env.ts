export const ENV = {
  appId: process.env.VITE_APP_ID ?? "product-card-generator",
  cookieSecret: process.env.JWT_SECRET ?? "local-development-secret",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
