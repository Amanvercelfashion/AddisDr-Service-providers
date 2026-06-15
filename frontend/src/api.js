import axios from 'axios';

// In development: VITE_API_URL is empty — Vite proxy forwards /api → localhost:4000
// In production:  VITE_API_URL = https://your-backend.vercel.app
const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err?.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ── Business context helper ───────────────────────────────────────────────────
function bizHeaders(businessId) {
  return { headers: { 'x-business-id': String(businessId) } };
}

// ── Business (public info) ────────────────────────────────────────────────────
export const getBusiness = (businessId) =>
  api.get('/business', bizHeaders(businessId));

export const getBusinessBySubdomain = (subdomain) =>
  api.get(`/business/by-subdomain/${subdomain}`);

// ── Service Categories ────────────────────────────────────────────────────────
export const getServiceCategories = (businessId) =>
  api.get('/service-categories', bizHeaders(businessId));

export const createServiceCategory = (businessId, data) =>
  api.post('/service-categories', data, bizHeaders(businessId));

export const updateServiceCategory = (businessId, id, data) =>
  api.put(`/service-categories/${id}`, data, bizHeaders(businessId));

export const deleteServiceCategory = (businessId, id) =>
  api.delete(`/service-categories/${id}`, bizHeaders(businessId));

// ── Services ──────────────────────────────────────────────────────────────────
export const getServices = (businessId, params) =>
  api.get('/services', { ...bizHeaders(businessId), params });

export const getServicesAdmin = (businessId) =>
  api.get('/services/admin', bizHeaders(businessId));

export const getService = (businessId, id) =>
  api.get(`/services/${id}`, bizHeaders(businessId));

export const createService = (businessId, formData) =>
  api.post('/services', formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-business-id': String(businessId) }
  });

export const updateService = (businessId, id, formData) =>
  api.put(`/services/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-business-id': String(businessId) }
  });

export const toggleServiceVisibility = (businessId, id) =>
  api.patch(`/services/${id}/visibility`, {}, bizHeaders(businessId));

export const deleteService = (businessId, id) =>
  api.delete(`/services/${id}`, bizHeaders(businessId));

export const deleteServiceImage = (businessId, serviceId, imgId) =>
  api.delete(`/services/${serviceId}/images/${imgId}`, bizHeaders(businessId));

// ── Work Hours ────────────────────────────────────────────────────────────────
export const getWorkHours = (businessId) =>
  api.get('/work-hours', bizHeaders(businessId));

export const updateWorkHours = (businessId, hours) =>
  api.put('/work-hours', { hours }, bizHeaders(businessId));

export const getWorkHoursStatus = (businessId) =>
  api.get('/work-hours/current-status', bizHeaders(businessId));

// ── Staff ─────────────────────────────────────────────────────────────────────
export const getStaff = (businessId) =>
  api.get('/staff', bizHeaders(businessId));

export const getStaffAdmin = (businessId) =>
  api.get('/staff/admin', bizHeaders(businessId));

export const createStaffMember = (businessId, formData) =>
  api.post('/staff', formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-business-id': String(businessId) }
  });

export const updateStaffMember = (businessId, id, formData) =>
  api.put(`/staff/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-business-id': String(businessId) }
  });

export const deleteStaffMember = (businessId, id) =>
  api.delete(`/staff/${id}`, bizHeaders(businessId));

// ── Reservations ──────────────────────────────────────────────────────────────
export const logReservationClick = (businessId) =>
  api.post('/reservations', {}, bizHeaders(businessId));

export const getReservationStats = (businessId) =>
  api.get('/reservations/stats', bizHeaders(businessId));

// ── Feedback ──────────────────────────────────────────────────────────────────
export const submitFeedback = (businessId, data) =>
  api.post('/feedback', data, bizHeaders(businessId));

export const getPublicFeedback = (businessId) =>
  api.get('/feedback/public', bizHeaders(businessId));

export const getFeedbackAdmin = (businessId) =>
  api.get('/feedback/admin', bizHeaders(businessId));

export const toggleFeedbackApproval = (businessId, id) =>
  api.patch(`/feedback/${id}/approve`, {}, bizHeaders(businessId));

export const deleteFeedback = (businessId, id) =>
  api.delete(`/feedback/${id}`, bizHeaders(businessId));

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalyticsOverview = (businessId) =>
  api.get('/analytics/overview', bizHeaders(businessId));

export const getReservationChart = (businessId) =>
  api.get('/analytics/reservation-chart', bizHeaders(businessId));

// ── Super Admin ───────────────────────────────────────────────────────────────
const superAdminApi = axios.create({ baseURL: `${BASE}/api/superadmin`, timeout: 15000 });
superAdminApi.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err?.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

function saHeaders(token) {
  return { headers: { 'x-super-admin': token } };
}

export const superAdminLogin = (username, password) =>
  superAdminApi.post('/login', { username, password });

export const saGetStats = (token) =>
  superAdminApi.get('/stats', saHeaders(token));

export const saGetBusinesses = (token) =>
  superAdminApi.get('/businesses', saHeaders(token));

export const saGetBusiness = (token, id) =>
  superAdminApi.get(`/businesses/${id}`, saHeaders(token));

export const saCreateBusiness = (token, formData) =>
  superAdminApi.post('/businesses', formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-super-admin': token }
  });

export const saUpdateBusiness = (token, id, formData) =>
  superAdminApi.put(`/businesses/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', 'x-super-admin': token }
  });

export const saToggleStatus = (token, id, status) =>
  superAdminApi.patch(`/businesses/${id}/status`, { status }, saHeaders(token));

export const saSetAdminPassword = (token, id, password) =>
  superAdminApi.patch(`/businesses/${id}/admin-password`, { password }, saHeaders(token));

export const saDeleteBusiness = (token, id) =>
  superAdminApi.delete(`/businesses/${id}`, saHeaders(token));
