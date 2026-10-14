const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Artwork could not be loaded"));
  image.src = src;
});

/** Rasterize the visible print master with embedded, source-native local artwork. */
export async function createTicketImage(source: SVGSVGElement): Promise<Blob> {
  await document.fonts.ready;
  const master = source.cloneNode(true) as SVGSVGElement;
  const bounds = source.viewBox.baseVal;
  const width = bounds.width < 1000 ? 1600 : 2400, height = Math.round(width * bounds.height / bounds.width);
  master.setAttribute("width", String(width)); master.setAttribute("height", String(height));
  master.removeAttribute("class"); master.removeAttribute("aria-label"); master.removeAttribute("role");
  await Promise.all(Array.from(master.querySelectorAll("image")).map(async node => {
    const href = node.getAttribute("href");
    if (!href) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) throw new Error("Ticket artwork must be local");
    const original = await loadImage(url.href);
    const embedded = document.createElement("canvas");
    embedded.width = original.naturalWidth; embedded.height = original.naturalHeight;
    const context = embedded.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(original, 0, 0);
    node.setAttribute("href", embedded.toDataURL("image/png"));
  }));
  const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(master)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const artwork = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(artwork, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"));
  } finally { URL.revokeObjectURL(svgUrl); }
}
