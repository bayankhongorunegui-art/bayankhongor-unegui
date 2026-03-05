const listEl = document.getElementById("list");
const qEl = document.getElementById("q");
const catEl = document.getElementById("category");
const onlyFeaturedEl = document.getElementById("onlyFeatured");
const clearEl = document.getElementById("clear");

document.getElementById("year").textContent = new Date().getFullYear();

async function render() {

  const q = (qEl.value || "").toLowerCase().trim();
  const cat = catEl.value || "";
  const onlyFeatured = !!onlyFeaturedEl?.checked;

  const ads = (await AdsStorage.all())
    .filter(ad => {

      const title = (ad.title || "").toLowerCase();
      const desc = (ad.description || "").toLowerCase();
      const loc = (ad.location || "").toLowerCase();

      const matchQ =
        !q ||
        title.includes(q) ||
        desc.includes(q) ||
        loc.includes(q);

      const matchCat = !cat || ad.category === cat;
      const matchFeatured = !onlyFeatured || !!ad.featured;

      return matchQ && matchCat && matchFeatured;

    })
    .sort((a,b)=> Number(!!b.featured) - Number(!!a.featured));

  if (!ads.length) {
    listEl.innerHTML =
      `<div class="card"><p class="muted">Одоогоор зар алга</p></div>`;
    return;
  }

  listEl.innerHTML = ads.map(ad => {

    const views = Number(ad.views || 0);

    return `
    <a class="card"
       href="details.html?id=${encodeURIComponent(ad.id)}"
       style="text-decoration:none;color:inherit">

      ${ad.image ?
      `<img src="${ad.image}"
       style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:10px">`
      : ""}

      <div class="row" style="justify-content:space-between">
        <h3>${escapeHtml(ad.title)}</h3>

        <div class="row">
          ${ad.featured ? `<span class="badge">⭐</span>` : ""}
          <span class="badge">${escapeHtml(ad.category)}</span>
        </div>
      </div>

      <p class="muted small">
      ${escapeHtml(ad.location)} •
      ${formatPrice(ad.price)} •
      👀 ${views}
      </p>

    </a>
    `;

  }).join("");

}

function formatPrice(p) {
  const n = Number(p||0);
  if (!n) return "Үнэ тохирно";
  return n.toLocaleString("mn-MN")+"₮";
}

function escapeHtml(str) {
  return String(str||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

qEl.addEventListener("input",render);
catEl.addEventListener("change",render);
onlyFeaturedEl?.addEventListener("change",render);

clearEl.addEventListener("click",()=>{
  qEl.value="";
  catEl.value="";
  if (onlyFeaturedEl) onlyFeaturedEl.checked=false;
  render();
});

render();