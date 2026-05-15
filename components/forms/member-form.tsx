type MemberFormProject = {
  id: string;
  name: string;
};

type MemberFormProps = {
  projects: MemberFormProject[];
};

export function MemberForm({ projects }: MemberFormProps) {
  return (
    <form className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        成员姓名
        <input
          className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          name="name"
          placeholder="例如：王五"
          type="text"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
        所属项目
        <select
          className="h-11 rounded-md border border-line bg-white px-3 text-base text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          defaultValue={projects[0]?.id ?? ""}
          name="projectId"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <button
        className="h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white opacity-70"
        disabled
        type="button"
      >
        添加成员
      </button>

      <p className="text-sm leading-6 text-ink-500 md:col-span-3">
        成员新增与更新的服务端动作会在后续任务接入；当前表单先固定字段结构，便于 Task 4 直接连接。
      </p>
    </form>
  );
}
