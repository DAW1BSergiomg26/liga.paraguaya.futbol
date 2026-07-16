import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const RED = join(process.cwd(), "public", "data", "red-clubes.json");

describe("datos del grafo de rivalidades (red3d)", () => {
  const data = JSON.parse(readFileSync(RED, "utf8")) as {
    nodes: Array<{ id: string }>;
    links: Array<{ source: string; target: string }>;
  };

  it("expone los 19 clubes sin duplicados", () => {
    expect(data.nodes).toHaveLength(19);
    const ids = data.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(19);
  });

  it("los enlaces referencian clubes existentes", () => {
    const ids = new Set(data.nodes.map((n) => n.id));
    for (const l of data.links) {
      expect(ids.has(l.source), `source inexistente: ${l.source}`).toBe(true);
      expect(ids.has(l.target), `target inexistente: ${l.target}`).toBe(true);
    }
  });

  it("coincide con el conteo mostrado en la UI (19 clubes)", () => {
    expect(data.nodes.length).toBe(19);
  });
});
