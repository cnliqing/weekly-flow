type MemberFormProject = {
  id: string;
  name: string;
};

type MemberFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  projects: MemberFormProject[];
};

export function MemberForm({ action, projects }: MemberFormProps) {
  return (
    <form action={action} className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
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
        className="h-11 rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-[#176447]"
        type="submit"
      >
        添加成员
      </button>
    </form>
  );
}
