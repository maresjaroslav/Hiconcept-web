async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst ${url}`);
  }
  return response.json();
}

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getProjectImagePath(slug, fileName) {
  return `projects/${slug}/${fileName}`;
}

function renderProjectCard(project) {
  const coverPath = project.cover
    ? getProjectImagePath(project.slug, project.cover)
    : "";

  const metaParts = [project.location, project.year].filter(Boolean);
  const meta = metaParts.join(" / ");

  const mediaHtml = coverPath
    ? `<img src="${coverPath}" alt="${escapeHtml(project.title)}" loading="lazy">`
    : `<div class="placeholder">Bez titulní fotky</div>`;

  return `
    <a class="project-card" href="project.html?slug=${encodeURIComponent(project.slug)}">
      <div class="project-card-media">
        ${mediaHtml}
      </div>
      <div class="project-card-body">
        <div class="project-meta">${escapeHtml(meta || project.type || "")}</div>
        <h3 class="project-title">${escapeHtml(project.title)}</h3>
        <p class="project-intro">${escapeHtml(project.intro || "")}</p>
      </div>
    </a>
  `;
}

async function initHomePage() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  try {
    const projects = await fetchJson("data/projects.json");

    grid.innerHTML = projects
      .map((project) => renderProjectCard(project))
      .join("");
  } catch (error) {
    grid.innerHTML = `
      <div class="error-box">
        Nepodařilo se načíst projekty.
      </div>
    `;
    console.error(error);
  }
}

function buildGalleryImages(project) {
  const images = [];

  if (project.cover) {
    images.push(project.cover);
  }

  if (Array.isArray(project.images)) {
    for (const image of project.images) {
      if (image && !images.includes(image)) {
        images.push(image);
      }
    }
  }

  return images;
}

function renderProjectPage(project) {
  const container = document.getElementById("project-detail");
  if (!container) return;

  const allImages = buildGalleryImages(project);

  const heroHtml = project.cover
    ? `<img src="${getProjectImagePath(project.slug, project.cover)}" alt="${escapeHtml(project.title)}">`
    : `<div class="placeholder">Bez hlavní fotky</div>`;

  const thumbsHtml = allImages.length
    ? allImages
        .map((imageName, index) => {
          const imagePath = getProjectImagePath(project.slug, imageName);
          return `
            <button class="gallery-thumb ${index === 0 ? "active" : ""}" type="button" data-image="${imagePath}">
              <div class="gallery-thumb-frame">
                <img src="${imagePath}" alt="${escapeHtml(project.title)}" loading="lazy">
              </div>
            </button>
          `;
        })
        .join("")
    : "";

  const firstGalleryImage = allImages.length
    ? getProjectImagePath(project.slug, allImages[0])
    : "";

  const galleryHtml = allImages.length
    ? `
      <section class="gallery page-shell">
        <div class="gallery-main" id="gallery-main">
          <img src="${firstGalleryImage}" alt="${escapeHtml(project.title)}">
        </div>
        <div class="gallery-thumbs" id="gallery-thumbs">
          ${thumbsHtml}
        </div>
      </section>
    `
    : "";

  const metaLocation = project.location || "—";
  const metaYear = project.year || "—";
  const metaType = project.type || "—";

  container.innerHTML = `
    <div class="page-shell">
      <div class="project-hero">
        ${heroHtml}
      </div>

      <div class="project-layout">
        <div class="project-main">
          <p class="section-label">Projekt</p>
          <h1>${escapeHtml(project.title)}</h1>
          <p>${escapeHtml(project.intro || "")}</p>
          <p>${escapeHtml(project.text || "")}</p>
        </div>

        <aside class="project-side">
          <dl>
            <div>
              <dt>Lokalita</dt>
              <dd>${escapeHtml(metaLocation)}</dd>
            </div>
            <div>
              <dt>Rok</dt>
              <dd>${escapeHtml(metaYear)}</dd>
            </div>
            <div>
              <dt>Typ</dt>
              <dd>${escapeHtml(metaType)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>

    ${galleryHtml}
  `;

  document.title = `${project.title} – Hiconcept`;

  const thumbs = document.querySelectorAll(".gallery-thumb");
  const main = document.querySelector("#gallery-main img");

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const image = thumb.dataset.image;
      if (!main || !image) return;

      main.src = image;

      thumbs.forEach((item) => item.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
}

async function initProjectPage() {
  const detail = document.getElementById("project-detail");
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    detail.innerHTML = `
      <div class="page-shell">
        <div class="error-box">Chybí slug projektu.</div>
      </div>
    `;
    return;
  }

  try {
    const projects = await fetchJson("data/projects.json");
    const project = projects.find((item) => item.slug === slug);

    if (!project) {
      throw new Error(`Projekt ${slug} nebyl nalezen.`);
    }

    renderProjectPage(project);
  } catch (error) {
    detail.innerHTML = `
      <div class="page-shell">
        <div class="error-box">Projekt se nepodařilo načíst.</div>
      </div>
    `;
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  if (page === "home") {
    initHomePage();
  }

  if (page === "project") {
    initProjectPage();
  }
});