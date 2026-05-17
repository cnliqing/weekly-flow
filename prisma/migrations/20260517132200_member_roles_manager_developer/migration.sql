ALTER TYPE "MemberRole" RENAME TO "MemberRole_old";

CREATE TYPE "MemberRole" AS ENUM ('manager', 'developer');

ALTER TABLE "Member"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "MemberRole"
  USING (
    CASE "role"::text
      WHEN 'admin' THEN 'manager'
      ELSE 'developer'
    END
  )::"MemberRole",
  ALTER COLUMN "role" SET DEFAULT 'developer';

DROP TYPE "MemberRole_old";
