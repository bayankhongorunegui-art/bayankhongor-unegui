const API = "http://localhost:3001/api/ads";

const AdsStorage = {

  async all() {
    const res = await fetch(API);
    return await res.json();
  },

  async getById(id) {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json();
  },

  async add(ad) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ad)
    });
    return await res.json();
  },

  async updateById(id, patch) {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    return await res.json();
  },

  async removeById(id, pin) {
    const res = await fetch(`${API}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    return await res.json();
  }

};