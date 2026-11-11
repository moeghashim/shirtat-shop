import { useState } from "react";

import { type ColumnDef, useTable } from "@tanstack/react-table";

import { DataTable, type DataTableFeatures, dataTableFeatures } from "@/components/blocks";
import { Button } from "@/components/ui/button";

type Request = { id: string; title: string; owner: string; status: string };
const data: Request[] = [
  { id: "REQ-101", title: "Review onboarding copy", owner: "Jordan Lee", status: "In review" },
  { id: "REQ-102", title: "Check mobile navigation", owner: "Morgan Chen", status: "Open" },
  { id: "REQ-103", title: "Document chart patterns", owner: "Alex Rivera", status: "Complete" },
  { id: "REQ-104", title: "Verify keyboard focus", owner: "Casey Patel", status: "Open" },
  { id: "REQ-105", title: "Publish release notes", owner: "Jordan Lee", status: "In review" },
];
const emptyData: Request[] = [];
const columns: ColumnDef<DataTableFeatures, Request>[] = [
  { accessorKey: "id", header: "Request", sortFn: "alphanumeric" },
  { accessorKey: "title", header: "Title", sortFn: "text" },
  { accessorKey: "owner", header: "Owner", sortFn: "text" },
  { accessorKey: "status", header: "Status", sortFn: "text" },
];

export function TableExample() {
  const [empty, setEmpty] = useState(false);
  const [reflow, setReflow] = useState(true);
  const table = useTable({
    features: dataTableFeatures,
    data: empty ? emptyData : data,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 3 } },
  });
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          aria-pressed={empty}
          onClick={() => {
            table.setPageIndex(0);
            setEmpty(!empty);
          }}
        >
          Empty state
        </Button>
        <Button variant="outline" aria-pressed={reflow} onClick={() => setReflow(!reflow)}>
          Mobile reflow
        </Button>
      </div>
      <DataTable
        table={table}
        label="Illustrative requests"
        mobile={reflow ? "reflow" : "scroll"}
        empty={
          <div className="space-y-2">
            <p>No requests to display.</p>
            <Button variant="outline" size="sm" onClick={() => setEmpty(false)}>
              Restore examples
            </Button>
          </div>
        }
      />
    </div>
  );
}
