import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { DataProvider as LogisticsProvider } from "../src/routes/(main)/dashboard/logistics/-components/data-context";
import { Logistics } from "../src/routes/(main)/dashboard/logistics/-components/logistics";
import { DataProvider as PatientsProvider } from "../src/routes/(main)/dashboard/patient-monitoring/-components/data-context";
import { PatientMonitoring } from "../src/routes/(main)/dashboard/patient-monitoring/-components/patient-monitoring";
import { demoLogistics } from "../src/server/data/logistics";
import { demoPatients } from "../src/server/data/patients";

export async function runOperationalStateProbe() {
  const logistics = await demoLogistics();
  const patients = await demoPatients();
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };
  const selected = () => container.querySelector('[aria-pressed="true"]')?.textContent;
  try {
    const renderLogistics = (shipments: typeof logistics.shipments) =>
      flushSync(() =>
        root.render(
          <LogisticsProvider data={{ ...logistics, shipments }}>
            <Logistics />
          </LogisticsProvider>,
        ),
      );
    renderLogistics(logistics.shipments);
    assert(selected()?.startsWith(`Select shipment #${logistics.shipments[0].id}`) === true, "Initial shipment");
    flushSync(() => container.querySelectorAll<HTMLButtonElement>("[aria-pressed]")[1].click());
    assert(selected()?.startsWith(`Select shipment #${logistics.shipments[1].id}`) === true, "Changed shipment");
    renderLogistics([logistics.shipments[0]]);
    assert(
      selected()?.startsWith(`Select shipment #${logistics.shipments[0].id}`) === true,
      "Removed selection must highlight fallback shipment",
    );
    assert(
      container.querySelector("h1")?.textContent === `#${logistics.shipments[0].id}`,
      "Fallback detail matches selection",
    );
    renderLogistics([]);
    assert(!container.querySelector("[aria-pressed]"), "Empty shipments");
    const renderPatients = (records: typeof patients.patients) =>
      flushSync(() =>
        root.render(
          <PatientsProvider data={{ ...patients, patients: records }}>
            <PatientMonitoring patients={records} initialPatientId={patients.settings.initialPatientId} />
          </PatientsProvider>,
        ),
      );
    renderPatients(patients.patients);
    assert(selected()?.includes("C04") === true, "Initial patient");
    flushSync(() => container.querySelectorAll<HTMLButtonElement>("[aria-pressed]")[1].click());
    assert(selected()?.includes("C02") === true, "Changed patient");
    renderPatients([patients.patients[0]]);
    assert(selected()?.includes("C01") === true, "Removed patient fallback");
    renderPatients([]);
    assert(container.textContent === "No patients available.", "Empty monitor");
    return "PASS Logistics/Patients initial, changed, removed and empty loaded selections";
  } finally {
    flushSync(() => root.unmount());
    container.remove();
  }
}
