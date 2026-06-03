import { useEffect, useState } from "react";
import type { Zone } from "./lib/types";
import type { SensorProfile } from "./lib/labels/types";
import { DEFAULT_ZONES } from "./data/zones";
import { loadProfiles, saveProfiles } from "./lib/labels/profiles";
import { AppShell, type ModuleId } from "./components/shell/AppShell";
import { Espacios } from "./components/modules/Espacios";
import { Medicion } from "./components/modules/Medicion";
import { Etiquetas } from "./components/modules/Etiquetas";

export default function App() {
  const [module, setModule] = useState<ModuleId>("library");
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  // Colección compartida de espacios medidos, persistida localmente.
  const [profiles, setProfiles] = useState<SensorProfile[]>(() => loadProfiles());
  const [spaceId, setSpaceId] = useState<string>(() => loadProfiles()[0]?.id ?? "");

  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  function openSpace(id: string) {
    setSpaceId(id);
    setModule("etiquetas");
  }

  return (
    <AppShell module={module} onModule={setModule}>
      <div key={module} className="module-enter">
        {module === "library" && (
          <Espacios profiles={profiles} onProfilesChange={setProfiles} selectedId={spaceId} onOpen={openSpace} />
        )}
        {module === "etiquetas" && (
          <Etiquetas profiles={profiles} onProfilesChange={setProfiles} selectedId={spaceId} onSelectId={setSpaceId} />
        )}
        {module === "medicion" && <Medicion zones={zones} onZonesChange={setZones} />}
      </div>
    </AppShell>
  );
}
