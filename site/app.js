(function () {
  "use strict";

  const initialSource = `box "Pikchr" fit fill white
arrow
box "SVG" fit fill white`;

  const state = {
    pikchr: null,
    source: "",
    svg: "",
    view: "editor",
    renderTimer: 0,
  };

  const elements = {
    workspace: document.getElementById("workspace"),
    sourceInput: document.getElementById("sourceInput"),
    previewCanvas: document.getElementById("previewCanvas"),
    previewMeta: document.getElementById("previewMeta"),
    console: document.getElementById("console"),
    darkModeInput: document.getElementById("darkModeInput"),
    plainErrorsInput: document.getElementById("plainErrorsInput"),
    diagramButton: document.getElementById("diagramButton"),
    editorButton: document.getElementById("editorButton"),
    resetButton: document.getElementById("resetButton"),
    copyButton: document.getElementById("copyButton"),
    copyCanvasButton: document.getElementById("copyCanvasButton"),
    downloadButton: document.getElementById("downloadButton"),
  };

  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  function encodeSource(source) {
    return encodeBytes(textEncoder.encode(source));
  }

  function decodeSource(value) {
    return textDecoder.decode(decodeBase64UrlToBytes(value));
  }

  function encodeBytes(bytes) {
    let binary = "";

    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeBase64UrlToBytes(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  function decodeLegacyBase64ToBytes(value) {
    const padded = decodeURIComponent(escape(atob(value)));
    const bytes = new Uint8Array(padded.length);

    for (let index = 0; index < padded.length; index += 1) {
      bytes[index] = padded.charCodeAt(index);
    }

    return bytes;
  }

  async function decodeCompressedSource(value) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("compressed source is not supported in this browser");
    }

    const bytes = decodeBase64UrlToBytes(value);
    const blob = new Blob([bytes]);
    const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }

  async function encodeCompressedSource(source) {
    if (typeof CompressionStream !== "function") {
      return null;
    }

    const bytes = textEncoder.encode(source);
    const blob = new Blob([bytes]);
    const stream = blob.stream().pipeThrough(new CompressionStream("gzip"));
    const compressed = await new Response(stream).arrayBuffer();

    return encodeBytes(new Uint8Array(compressed));
  }

  async function encodeSourceForUrl(source) {
    const encoded = encodeSource(source);
    const compressed = await encodeCompressedSource(source);

    if (!compressed) {
      return { compressed: false, value: encoded };
    }

    // Prefer compressed only when it is actually smaller than plain encoding.
    return compressed.length < encoded.length
      ? { compressed: true, value: compressed }
      : { compressed: false, value: encoded };
  }

  function decodeLegacyBase64(value) {
    return textDecoder.decode(decodeLegacyBase64ToBytes(value));
  }

  async function readSourceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const compressedSource = params.get("sourcez");
    const legacyEncoded = params.get("encoded");
    const encodedSource = params.get("source");

    if (compressedSource) {
      try {
        return await decodeCompressedSource(compressedSource);
      } catch (_error) {
        // fall through to base64/plain sources
      }
    }

    if (encodedSource) {
      try {
        return decodeSource(encodedSource);
      } catch (_error) {
        return initialSource;
      }
    }

    if (legacyEncoded) {
      try {
        return decodeLegacyBase64(legacyEncoded);
      } catch (_error) {
        return initialSource;
      }
    }

    return initialSource;
  }

  function readViewFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");

    if (view === "canvas" || view === "diagram") {
      return "diagram";
    }

    if (view === "editor") {
      return "editor";
    }

    return "editor";
  }

  function normalizeView(view) {
    if (view === "canvas" || view === "diagram") {
      return "diagram";
    }

    if (view === "editor") {
      return "editor";
    }

    return "editor";
  }

  async function buildShareUrl(viewOverride) {
    state.source = elements.sourceInput.value;
    const params = new URLSearchParams();
    const encoded = await encodeSourceForUrl(state.source);
    params.delete("source");
    params.delete("sourcez");

    if (encoded.compressed) {
      params.set("sourcez", encoded.value);
    } else {
      params.set("source", encoded.value);
    }

    const view = normalizeView(viewOverride ?? state.view);
    const viewParam = view === "diagram"
      ? viewOverride === "canvas" ? "canvas" : "diagram"
      : view;

    if (viewParam === "diagram" || viewParam === "canvas") {
      params.set("view", viewParam);
    }

    return `${window.location.pathname}?${params.toString()}`;
  }

  async function writeUrl(viewOverride) {
    const url = await buildShareUrl(viewOverride);
    window.history.replaceState(null, "", url);
  }

  function setConsole(message, mode) {
    elements.console.textContent = message;
    elements.console.classList.toggle("success", mode === "success");
    elements.console.classList.toggle("error", mode === "error");
  }

  function currentFlags() {
    if (!state.pikchr) {
      return 0;
    }

    let flags = 0;

    if (elements.darkModeInput.checked) {
      flags |= state.pikchr.flags.DARK_MODE;
    }

    if (elements.plainErrorsInput.checked) {
      flags |= state.pikchr.flags.PLAINTEXT_ERRORS;
    }

    return flags;
  }

  function render() {
    if (!state.pikchr) {
      return;
    }

    state.source = elements.sourceInput.value;
    void writeUrl(undefined);
    elements.previewCanvas.classList.toggle("dark", elements.darkModeInput.checked);

    if (!state.source.trim()) {
      state.svg = "";
      elements.previewCanvas.innerHTML = "";
      elements.previewMeta.textContent = "";
      elements.downloadButton.disabled = true;
      setConsole("Ready", "success");
      return;
    }

    try {
      const result = state.pikchr.render(state.source, "pikchr-output", currentFlags());

      if (!result.svg.startsWith("<svg")) {
        state.svg = "";
        elements.previewCanvas.innerHTML = `<pre class="preview-error">${escapeHtml(result.svg)}</pre>`;
        elements.previewMeta.textContent = "";
        elements.downloadButton.disabled = true;
        setConsole(result.svg, "error");
        return;
      }

      state.svg = result.svg;
      elements.previewCanvas.innerHTML = result.svg;
      elements.previewMeta.textContent = `${result.width} x ${result.height}`;
      elements.downloadButton.disabled = false;
      setConsole(">>> Success", "success");
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      state.svg = "";
      elements.previewCanvas.innerHTML = `<pre class="preview-error">${escapeHtml(message)}</pre>`;
      elements.previewMeta.textContent = "";
      elements.downloadButton.disabled = true;
      setConsole(message, "error");
    }
  }

  function scheduleRender() {
    window.clearTimeout(state.renderTimer);
    state.renderTimer = window.setTimeout(render, 90);
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setView(view) {
    state.view = normalizeView(view);
    elements.workspace.classList.toggle("diagram-mode", state.view === "diagram");
    elements.copyCanvasButton.hidden = state.view !== "diagram";
    void writeUrl(state.view);
  }

  function resetSource() {
    const confirmed = window.confirm("Reset the current diagram?");

    if (!confirmed) {
      return;
    }

    elements.sourceInput.value = initialSource;
    scheduleRender();
  }

  function copyLink() {
    void copyUrlToClipboard();
  }

  async function copyCanvasLink() {
    await copyUrlToClipboard("canvas", "Copied canvas link");
  }

  async function copyUrlToClipboard(viewOverride, successMessage = "Copied link") {
    const url = await buildShareUrl(viewOverride);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => setConsole(successMessage, "success"),
        () => setConsole(url, "success")
      );
      return;
    }

    setConsole(url, "success");
  }

  function downloadSvg() {
    if (!state.svg) {
      return;
    }

    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("-");
    const url = URL.createObjectURL(new Blob([state.svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = `pikchr-${stamp}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    elements.sourceInput.addEventListener("input", scheduleRender);
    elements.darkModeInput.addEventListener("change", render);
    elements.plainErrorsInput.addEventListener("change", render);
    elements.diagramButton.addEventListener("click", () => setView("diagram"));
    elements.editorButton.addEventListener("click", () => setView("editor"));
    elements.resetButton.addEventListener("click", resetSource);
    elements.copyButton.addEventListener("click", copyLink);
    elements.copyCanvasButton.addEventListener("click", copyCanvasLink);
    elements.downloadButton.addEventListener("click", downloadSvg);

    window.addEventListener("popstate", () => {
      void (async () => {
        elements.sourceInput.value = await readSourceFromUrl();
        setView(readViewFromUrl());
        render();
      })();
    });
  }

  function initialize() {
    void (async () => {
      elements.sourceInput.value = await readSourceFromUrl();
      setView(readViewFromUrl());
      bindEvents();

      try {
        state.pikchr = await window.loadPikchr();
        render();
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        setConsole(message, "error");
      }
    })();
  }

  initialize();
})();
