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
    downloadButton: document.getElementById("downloadButton"),
  };

  function encodeSource(source) {
    const bytes = new TextEncoder().encode(source);
    let binary = "";

    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeBase64Url(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new TextDecoder().decode(bytes);
  }

  function decodeLegacyBase64(value) {
    return decodeURIComponent(escape(atob(value)));
  }

  function readSourceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const encodedSource = params.get("source");
    const legacyEncoded = params.get("encoded");

    if (encodedSource) {
      try {
        return decodeBase64Url(encodedSource);
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
    return params.get("view") === "diagram" ? "diagram" : "editor";
  }

  function writeUrl() {
    const params = new URLSearchParams();
    params.set("source", encodeSource(state.source));

    if (state.view === "diagram") {
      params.set("view", "diagram");
    }

    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
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
    writeUrl();
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
    state.view = view;
    elements.workspace.classList.toggle("diagram-mode", view === "diagram");
    writeUrl();
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
    writeUrl();
    const url = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => setConsole("Copied link", "success"),
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
    elements.downloadButton.addEventListener("click", downloadSvg);

    window.addEventListener("popstate", () => {
      elements.sourceInput.value = readSourceFromUrl();
      setView(readViewFromUrl());
      render();
    });
  }

  function initialize() {
    elements.sourceInput.value = readSourceFromUrl();
    setView(readViewFromUrl());
    bindEvents();

    window.loadPikchr().then((pikchr) => {
      state.pikchr = pikchr;
      render();
    }).catch((error) => {
      const message = error && error.message ? error.message : String(error);
      setConsole(message, "error");
    });
  }

  initialize();
})();
