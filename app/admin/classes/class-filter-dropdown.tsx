"use client";

import { useRouter } from "next/navigation";

type ClassFilterDropdownProps = {
  currentFilter: string;
};

export function ClassFilterDropdown({ currentFilter }: ClassFilterDropdownProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="class-filter" className="text-sm font-medium text-zinc-700">
        Status
      </label>
      <select
        id="class-filter"
        value={currentFilter}
        onChange={(e) => {
          const value = e.target.value;
          router.push(`/admin/classes?filter=${encodeURIComponent(value)}`);
        }}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="all">All</option>
      </select>
    </div>
  );
}
