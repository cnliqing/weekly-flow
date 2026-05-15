type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  appUrl: string;
};

function readNodeEnv(): AppEnv["nodeEnv"] {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  ) {
    return process.env.NODE_ENV;
  }

  return "development";
}

export const env: AppEnv = {
  nodeEnv: readNodeEnv(),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
