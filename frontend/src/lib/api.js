import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = {
  // Activities
  getActivities: (date) =>
    axios.get(`${API}/activities`, { params: date ? { date } : {} }).then((r) => r.data),
  createActivity: (data) =>
    axios.post(`${API}/activities`, data).then((r) => r.data),
  updateActivity: (id, data) =>
    axios.put(`${API}/activities/${id}`, data).then((r) => r.data),
  deleteActivity: (id) =>
    axios.delete(`${API}/activities/${id}`).then((r) => r.data),
  reorderActivities: (updates) =>
    axios.post(`${API}/activities/reorder`, updates).then((r) => r.data),

  // Expenses
  getExpenses: () => axios.get(`${API}/expenses`).then((r) => r.data),
  createExpense: (data) => axios.post(`${API}/expenses`, data).then((r) => r.data),
  deleteExpense: (id) => axios.delete(`${API}/expenses/${id}`).then((r) => r.data),

  // Packing
  getPackingItems: () => axios.get(`${API}/packing-items`).then((r) => r.data),
  createPackingItem: (data) => axios.post(`${API}/packing-items`, data).then((r) => r.data),
  updatePackingItem: (id, data) => axios.put(`${API}/packing-items/${id}`, data).then((r) => r.data),
  deletePackingItem: (id) => axios.delete(`${API}/packing-items/${id}`).then((r) => r.data),

  // Notes
  getNotes: () => axios.get(`${API}/notes`).then((r) => r.data),
  createNote: (data) => axios.post(`${API}/notes`, data).then((r) => r.data),
  updateNote: (id, data) => axios.put(`${API}/notes/${id}`, data).then((r) => r.data),
  deleteNote: (id) => axios.delete(`${API}/notes/${id}`).then((r) => r.data),

  // Settings
  getSettings: () => axios.get(`${API}/settings`).then((r) => r.data),
  updateSettings: (data) => axios.put(`${API}/settings`, data).then((r) => r.data),

  // Conversions
  getConversions: () => axios.get(`${API}/conversions`).then((r) => r.data),
  createConversion: (data) => axios.post(`${API}/conversions`, data).then((r) => r.data),

  // Weather
  getWeather: (city) => axios.get(`${API}/weather/${city}`).then((r) => r.data),

  // Seed
  seed: () => axios.post(`${API}/seed`).then((r) => r.data),

  // Export / Import
  exportData: () => axios.get(`${API}/export`).then((r) => r.data),
  importData: (data) => axios.post(`${API}/import`, data).then((r) => r.data),

  // ICS
  getIcsUrl: (date) => {
    const params = date ? `?date=${date}` : "";
    return `${API}/ics${params}`;
  },
};

export default api;
