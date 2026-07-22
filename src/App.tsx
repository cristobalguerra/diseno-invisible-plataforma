import { useEffect, useRef, useState } from "react";
import type { SensorProfile } from "./lib/labels/types";
import {
  deleteProfilesRemote,
  fetchProfilesRemote,
  loadProfiles,
  saveProfiles,
  upsertProfilesRemote,
} from "./lib/labels/profiles";
import type { Plano, PlanoMap } from "./lib/plano/types";
import {
  deletePlanosRemote,
  fetchPlanosRemote,
  loadPlanos,
  savePlanos,
  upsertPlanosRemote,
} from "./lib/plano/store";
import { REMOTE_ENABLED, supabase } from "./lib/supabase";
import { AppShell, type ModuleId } from "./components/shell/AppShell";
import { Medicion } from "./components/modules/Medicion";
import { Etiquetas } from "./components/modules/Etiquetas";
import { Plano as PlanoModule } from "./components/modules/Plano";

export default function App() {
  const [module, setModule] = useState<ModuleId>("etiquetas");
  // Repositorio compartido (Supabase si está configurado, localStorage como fallback)
  const [profiles, setProfiles] = useState<SensorProfile[]>(() => loadProfiles());
  const [spaceId, setSpaceId] = useState<string>(() => loadProfiles()[0]?.id ?? "");
  const [planos, setPlanos] = useState<PlanoMap>(() => loadPlanos());

  // marca de hidratación remota: bloquea push de cambios hasta que termina la carga inicial,
  // así no sobreescribimos Supabase con la copia local desfasada del visitante
  const hydrated = useRef(false);
  // suprime el siguiente push cuando el cambio vino de realtime (no rebota al servidor)
  const skipPushProfiles = useRef(false);
  const skipPushPlanos = useRef(false);
  // estados previos para calcular diffs en cada cambio
  const prevProfiles = useRef<SensorProfile[]>(profiles);
  const prevPlanos = useRef<PlanoMap>(planos);

  // Carga inicial remota + suscripción realtime
  useEffect(() => {
    if (!REMOTE_ENABLED || !supabase) {
      hydrated.current = true;
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [remoteProfiles, remotePlanos] = await Promise.all([
          fetchProfilesRemote(),
          fetchPlanosRemote(),
        ]);
        if (!alive) return;
        skipPushProfiles.current = true;
        skipPushPlanos.current = true;
        setProfiles(remoteProfiles);
        setPlanos(remotePlanos);
        prevProfiles.current = remoteProfiles;
        prevPlanos.current = remotePlanos;
        if (!spaceId && remoteProfiles[0]) setSpaceId(remoteProfiles[0].id);
      } catch (err) {
        console.error("[supabase] carga inicial falló, uso fallback local:", err);
      } finally {
        hydrated.current = true;
      }
    })();

    const ch = supabase
      .channel("repo")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchProfilesRemote().then((rows) => {
          skipPushProfiles.current = true;
          setProfiles(rows);
          prevProfiles.current = rows;
        }).catch((err) => console.error("[realtime] profiles:", err));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "planos" }, () => {
        fetchPlanosRemote().then((map) => {
          skipPushPlanos.current = true;
          setPlanos(map);
          prevPlanos.current = map;
        }).catch((err) => console.error("[realtime] planos:", err));
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push de cambios locales → Supabase (diff por id) + mirror a localStorage
  useEffect(() => {
    saveProfiles(profiles);
    if (!hydrated.current || !REMOTE_ENABLED) {
      prevProfiles.current = profiles;
      return;
    }
    if (skipPushProfiles.current) {
      skipPushProfiles.current = false;
      prevProfiles.current = profiles;
      return;
    }
    const prev = prevProfiles.current;
    const prevIds = new Set(prev.map((p) => p.id));
    const nextIds = new Set(profiles.map((p) => p.id));
    const upserts = profiles.filter((p) => {
      const before = prev.find((x) => x.id === p.id);
      return !before || JSON.stringify(before) !== JSON.stringify(p);
    });
    const removed = prev.filter((p) => !nextIds.has(p.id)).map((p) => p.id);
    void upsertProfilesRemote(upserts).catch((err) => console.error("[supabase] upsert profiles:", err));
    void deleteProfilesRemote(removed).catch((err) => console.error("[supabase] delete profiles:", err));
    prevProfiles.current = profiles;
    // dimension fix: reference to prevIds so eslint no-unused-var no chille
    void prevIds;
  }, [profiles]);

  useEffect(() => {
    savePlanos(planos);
    if (!hydrated.current || !REMOTE_ENABLED) {
      prevPlanos.current = planos;
      return;
    }
    if (skipPushPlanos.current) {
      skipPushPlanos.current = false;
      prevPlanos.current = planos;
      return;
    }
    const prev = prevPlanos.current;
    const upserts: Plano[] = [];
    for (const site of Object.keys(planos)) {
      if (JSON.stringify(prev[site]) !== JSON.stringify(planos[site])) upserts.push(planos[site]);
    }
    const removed = Object.keys(prev).filter((site) => !(site in planos));
    void upsertPlanosRemote(upserts).catch((err) => console.error("[supabase] upsert planos:", err));
    void deletePlanosRemote(removed).catch((err) => console.error("[supabase] delete planos:", err));
    prevPlanos.current = planos;
  }, [planos]);

  return (
    <AppShell module={module} onModule={setModule}>
      <div key={module} className="module-enter">
        {module === "etiquetas" && (
          <Etiquetas profiles={profiles} onProfilesChange={setProfiles} selectedId={spaceId} onSelectId={setSpaceId} />
        )}
        {module === "medicion" && (
          <Medicion profiles={profiles} onProfilesChange={setProfiles} selectedId={spaceId} onSelectId={setSpaceId} />
        )}
        {module === "plano" && (
          <PlanoModule profiles={profiles} planos={planos} onPlanosChange={setPlanos} selectedId={spaceId} onSelectId={setSpaceId} />
        )}
      </div>
    </AppShell>
  );
}
