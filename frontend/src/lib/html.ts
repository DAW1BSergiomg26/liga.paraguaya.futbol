// Utilidades para renderizar contenido HTML de noticias (RSS) de forma segura.

// Convierte HTML crudo en texto plano limpio (quita tags y decodifica
// entidades como &#8230; -> … y &ntilde; -> ñ). Para tarjetas y resumen.
export function htmlToText(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

// Sanitiza HTML para renderizarlo con formato sin riesgo XSS.
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, style, iframe, object, embed")
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();
      if (name.startsWith("on") || value.includes("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
    if (el.tagName.toLowerCase() === "a") {
      const href = el.getAttribute("href") || "";
      if (!/^https?:\/\//i.test(href)) el.removeAttribute("href");
    }
  });
  return doc.body.innerHTML;
}
