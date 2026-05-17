import { MemberForm } from "@/components/forms/member-form";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Card } from "@/components/ui/card";
import { getActionErrorMessage, redirectWithFeedback } from "@/lib/action-feedback";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function addMember(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员已添加。";

  try {
    const projectId = String(formData.get("projectId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!projectId || !name) {
      throw new Error("请选择项目并填写成员姓名。");
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
    message = "成员已添加或重新启用。";
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "添加成员失败");
  }

  redirectWithFeedback("/admin/members", type, message);
}

async function toggleMemberStatus(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员状态已更新。";

  try {
    const memberId = String(formData.get("memberId") ?? "").trim();
    const nextStatus = String(formData.get("isActive") ?? "") === "true";

    if (!memberId) {
      throw new Error("缺少成员 ID。");
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
    message = nextStatus ? "成员已启用。" : "成员已停用。";
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "更新成员状态失败");
  }

  redirectWithFeedback("/admin/members", type, message);
}

async function deleteMember(formData: FormData) {
  "use server";

  let type: "success" | "error" = "success";
  let message = "成员已删除。";

  try {
    const memberId = String(formData.get("memberId") ?? "").trim();

    if (!memberId) {
      throw new Error("缺少成员 ID。");
    }

    const member = await prisma.member.findUnique({
      where: {
        id: memberId,
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error("成员不存在或已被删除。");
    }

    if (member._count.submissions > 0) {
      throw new Error("该成员已有周报提交，不能删除；可停用成员以保留历史记录。");
    }

    await prisma.member.delete({
      where: {
        id: memberId,
      },
    });

    revalidatePath("/admin/members");
    revalidatePath("/admin/cycles");
  } catch (error) {
    type = "error";
    message = getActionErrorMessage(error, "删除成员失败");
  }

  redirectWithFeedback("/admin/members", type, message);
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
          业务成员使用 Prisma `Member` 管理；系统采用开放工作台模式，不再区分后台登录账号。
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
                    <div className="flex flex-wrap gap-3">
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
                    <form action={deleteMember}>
                      <input name="memberId" type="hidden" value={member.id} />
                      <ConfirmSubmitButton
                        className="font-semibold text-red-600 hover:underline"
                        confirmMessage={`确认删除成员「${member.name}」？已有周报提交的成员会被系统阻止删除。`}
                        type="submit"
                      >
                        删除
                      </ConfirmSubmitButton>
                    </form>
                    </div>
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
