"use client";

import { useState } from "react";
import { memberRoleOptions } from "@/lib/member-role";

type MemberRow = {
  defaultRole: "manager" | "developer";
  id: number;
};

export function ProjectMemberRows() {
  const [nextId, setNextId] = useState(2);
  const [rows, setRows] = useState<MemberRow[]>([
    {
      defaultRole: "manager",
      id: 1,
    },
  ]);

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        defaultRole: "developer",
        id: nextId,
      },
    ]);
    setNextId((currentId) => currentId + 1);
  }

  function removeRow(rowId: number) {
    setRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((row) => row.id !== rowId)
        : currentRows,
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">团队成员</h2>
          <p className="mt-1 text-sm text-ink-500">
            默认至少保留一名成员，可按需要继续添加或删除。
          </p>
        </div>
        <button
          className="h-10 w-fit rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink-900 transition hover:border-ink-500"
          onClick={addRow}
          type="button"
        >
          添加成员
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-paper text-ink-700">
            <tr>
              <th className="px-4 py-3 font-semibold">姓名</th>
              <th className="px-4 py-3 font-semibold">角色</th>
              <th className="w-24 px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <input
                    className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    name="memberName"
                    placeholder={index === 0 ? "例如：张三" : ""}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    defaultValue={row.defaultRole}
                    name="memberRole"
                  >
                    {memberRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:text-ink-300"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.id)}
                    type="button"
                  >
                    删除成员
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
