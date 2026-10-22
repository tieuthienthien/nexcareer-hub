import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_DESIGN, buildCss, contentFor } from "@/lib/siteDesign";

const DesignContext = createContext({ design: DEFAULT_DESIGN, ready: false, save: async () => {} });

function normalize(record) {
  return {
    theme: { ...DEFAULT_DESIGN.theme, ...(record?.theme || {}) },
    background: { ...DEFAULT_DESIGN.background, ...(record?.background || {}) },
    content: record?.content || {},
    preset: record?.preset || "",
  };
}

async function loadRecord() {
  const res = await base44.entities.SiteDesign.list({ limit: 1 });
  return Array.isArray(res) ? res[0] : res?.items?.[0];
}

export function SiteDesignProvider({ children }) {
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const record = await loadRecord();
        if (alive && record) setDesign(normalize(record));
      } catch (e) {
        // Không đọc được cấu hình thì dùng bộ giao diện mặc định
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let el = document.getElementById("site-design-vars");
    if (!el) {
      el = document.createElement("style");
      el.id = "site-design-vars";
      document.head.appendChild(el);
    }
    el.textContent = buildCss(design);
  }, [design]);

  const save = async (next) => {
    const payload = {
      theme: next.theme,
      background: next.background,
      content: next.content || {},
      preset: next.preset || "",
    };
    const existing = await loadRecord();
    if (existing) await base44.entities.SiteDesign.update(existing.id, payload);
    else await base44.entities.SiteDesign.create(payload);
    setDesign(normalize(payload));
    return payload;
  };

  return <DesignContext.Provider value={{ design, ready, save }}>{children}</DesignContext.Provider>;
}

export function useSiteDesign() {
  return useContext(DesignContext);
}

export function useSiteContent(page) {
  const { design } = useSiteDesign();
  return contentFor(design, page);
}