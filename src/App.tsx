import { useState } from "react";
import type { CategoryId, Severity, Zone } from "./lib/types";
import { DEFAULT_ZONES } from "./data/zones";
import { AppShell, type ModuleId } from "./components/shell/AppShell";
import { Library } from "./components/modules/Library";
import { Editor } from "./components/modules/Editor";
import { Signage } from "./components/modules/Signage";
import { SensoryMap } from "./components/modules/SensoryMap";
import { Medicion } from "./components/modules/Medicion";
import { Etiquetas } from "./components/modules/Etiquetas";

export default function App() {
  const [module, setModule] = useState<ModuleId>("library");
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [preset, setPreset] = useState<{ category: CategoryId; sev: Severity } | null>(null);

  function openInEditor(category: CategoryId, sev: Severity) {
    setPreset({ category, sev });
    setModule("editor");
  }

  return (
    <AppShell module={module} onModule={setModule}>
      <div key={module} className="module-enter">
        {module === "library" && <Library onOpen={openInEditor} />}
        {module === "editor" && <Editor preset={preset} />}
        {module === "signage" && <Signage zones={zones} onZonesChange={setZones} />}
        {module === "map" && <SensoryMap zones={zones} />}
        {module === "medicion" && <Medicion zones={zones} onZonesChange={setZones} />}
        {module === "etiquetas" && <Etiquetas />}
      </div>
    </AppShell>
  );
}
