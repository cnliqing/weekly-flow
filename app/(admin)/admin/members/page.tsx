import { MemberForm } from "@/components/forms/member-form";
import { Card } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addMember(formData: FormData) {
  "use server";

  const session = await getAdminSession();

  if (!session) {
    return;
  }

  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!projectId || !name) {
    return;
  }

  await prisma.member.upsert({
    where: {
      projectId_name: {
        projectId,
        name,
      },
    },
    update: {
      isActive: true,
      role: "member",
    },
    create: {
      projectId,
      name,
      role: "member",
      isActive: true,
    },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/cycles");
}

async function toggleMemberStatus(formData: FormData) {
  "use server";

  const session = await getAdminSession();

  if (!session) {
    return;
  }

  const memberId = String(formData.get("memberId") ?? "").trim();
  const nextStatus = String(formData.get("isActive") ?? "") === "true";

  if (!memberId) {
    return;
  }

  await prisma.member.update({
    where: {
      id: memberId,
    },
    data: {
      isActive: nextStatus,
    },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/cycles");
}

export default async function AdminMembersPage() {
  const projects = await prisma.project.findMany({
    include: {
      members: {
        orderBy: [
          {
            role: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const members = projects.flatMap((project) =>
    project.members.map((member) => ({
      ...member,
      projectName: project.name,
    })),
  );

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-sm font-semibold text-accent">成员维护</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal">成员</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-700">
          业务成员仍使用 Prisma `Member` 管理；管理员登录账号来自环境变量，不会写入成员登录表。
        </p>
      </div>

      <Card>
        <h3 className="mb-5 text-xl font-semibold">新增成员</h3>
        <MemberForm action={addMember} projects={projects} />
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">当前成员</h3>
          <span className="text-sm text-ink-500">共 {members.length} 人</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-paper text-ink-700">
              <tr>
                <th className="px-4 py-3 font-semibold">姓名</th>
                <th className="px-4 py-3 font-semibold">项目</th>
                <th className="px-4 py-3 font-semibold">角色</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {member.name}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{member.projectName}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {member.role === "admin" ? "管理员" : "成员"}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {member.isActive ? "启用" : "停用"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleMemberStatus}>
                      <input name="memberId" type="hidden" value={member.id} />
                      <input
                        name="isActive"
                        type="hidden"
                        value={member.isActive ? "false" : "true"}
                      />
                      <button
                        className="font-semibold text-accent hover:underline"
                        type="submit"
                      >
                        {member.isActive ? "停用" : "启用"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length === 0 ? (
          <p className="mt-4 text-sm text-ink-700">
            暂无成员数据。请先运行 `npm run db:seed` 写入默认成员。
          </p>
        ) : null}
      </Card>
    </section>
  );
}
