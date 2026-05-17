export type SystemOperator = {
  email: string;
  name: string;
  role: "admin";
};

export function getSystemOperator(): SystemOperator {
  return {
    email: "open-access@local",
    name: "开放访问用户",
    role: "admin",
  };
}
