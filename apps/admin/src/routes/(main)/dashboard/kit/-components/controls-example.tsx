import { useState } from "react";

import { FilterSelect } from "@/components/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ControlsExample() {
  const [status, setStatus] = useState("All");
  return (
    <section id="controls" aria-labelledby="controls-title" className="space-y-4 border-t pt-6">
      <h2 id="controls-title" className="text-lg font-medium">
        Controls and filter rows
      </h2>
      <p className="text-muted-foreground">
        Use one size step and align items to the end. FilterSelect accepts label, value, options (with optional counts),
        onValueChange, allValue and searchable. Clear restores focus to its trigger.
      </p>
      <div className="overflow-x-auto pb-2">
        <div data-testid="control-regression-row" className="flex w-max items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="kit-phase">Phase</label>
            <Select defaultValue="all">
              <SelectTrigger id="kit-phase">
                <SelectValue>All phases</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All phases</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="kit-area">Area</label>
            <NativeSelect id="kit-area">
              <NativeSelectOption>All areas</NativeSelectOption>
              <NativeSelectOption>Operations</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="kit-start">Start date</label>
            <Input id="kit-start" type="date" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="kit-end">End date</label>
            <Input id="kit-end" type="date" />
          </div>
          <Button>Apply</Button>
        </div>
      </div>
      <FilterSelect
        label="Status"
        value={status}
        onValueChange={setStatus}
        options={[
          { value: "All", label: "All" },
          { value: "Active", label: "Active", count: 4 },
        ]}
      />
    </section>
  );
}
