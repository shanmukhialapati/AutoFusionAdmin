import axiosInstance from '../../axios/axiosInstance';

// --- VEHICLE ENDPOINTS ---

export const vehicleApi = {
  // CREATE VEHICLE (ADMIN)
  createVehicle: (data: any) => axiosInstance.post('/vehicles', data),

  // GET VEHICLE BY ID (PUBLIC)
  getVehicleById: (id: number) => axiosInstance.get(`/vehicles/${id}`),

  // GET VEHICLES BY BRAND (PUBLIC)
  getVehiclesByBrand: (brand: string) => axiosInstance.get(`/vehicles/brand/${brand}`),

  // GET ALL BRANDS DROPDOWN (PUBLIC)
  getAllBrands: () => axiosInstance.get('/vehicles/brands'),

  // GET MODELS BY BRAND DROPDOWN (PUBLIC)
  getModelsByBrand: (brand: string) => axiosInstance.get(`/vehicles/brands/${brand}/models`),

  // GET YEARS BY BRAND & MODEL DROPDOWN (PUBLIC)
  getYearsByBrandModel: (brand: string, model: string) => 
    axiosInstance.get(`/vehicles/brands/${brand}/models/${model}/years`),

  // UPDATE VEHICLE (ADMIN)
  updateVehicle: (id: number, data: any) => axiosInstance.put(`/vehicles/${id}`, data),

  // TOGGLE VEHICLE STATUS (ADMIN)
  toggleVehicleStatus: (id: number) => axiosInstance.patch(`/vehicles/${id}/toggle-status`),

  // DELETE VEHICLE (ADMIN) - SOFT DELETE
  deleteVehicle: (id: number) => axiosInstance.delete(`/vehicles/${id}`),

  // GET ALL VEHICLES (ADMIN ONLY)
  getAllVehiclesAdmin: () => axiosInstance.get('/vehicles/admin/all'),
};

// --- COMPATIBILITY ENDPOINTS ---

export const compatibilityApi = {
  // CREATE COMPATIBILITY (ADMIN)
  createCompatibility: (productId: number, vehicleId: number) => 
    axiosInstance.post('/compatibility', { productId, vehicleId }),

  // GET COMPATIBILITY BY ID (PUBLIC)
  getCompatibilityById: (id: number) => axiosInstance.get(`/compatibility/${id}`),

  // GET ALL COMPATIBILITIES BY PRODUCT (PUBLIC)
  getCompatibilitiesByProduct: (productId: number) => 
    axiosInstance.get(`/compatibility/product/${productId}`),

  // GET ALL COMPATIBILITIES BY VEHICLE (PUBLIC)
  getCompatibilitiesByVehicle: (vehicleId: number) => 
    axiosInstance.get(`/compatibility/vehicle/${vehicleId}`),

  // SEARCH COMPATIBLE PRODUCTS BY SPECS (PUBLIC)
  searchCompatibleProducts: (brand: string, model: string, year: number) => 
    axiosInstance.get(`/compatibility/search`, { params: { brand, model, year } }),

  // DELETE COMPATIBILITY (ADMIN)
  deleteCompatibility: (id: number) => axiosInstance.delete(`/compatibility/${id}`),
};

// --- COMPATIBILITY DETAILS API ---

export const compatibilityDetailsApi = {
  // CREATE COMPATIBILITY DETAILS (ADMIN)
  createDetails: (data: any) => axiosInstance.post('/compatibility-details', data),

  // GET DETAILS BY ID (PUBLIC)
  getDetailsById: (id: number) => axiosInstance.get(`/compatibility-details/${id}`),

  // GET DETAILS BY COMPATIBILITY ID (PUBLIC)
  getDetailsByCompatibilityId: (compatibilityId: number) => 
    axiosInstance.get(`/compatibility-details/compatibility/${compatibilityId}`),

  // UPDATE DETAILS (ADMIN)
  updateDetails: (id: number, data: any) => axiosInstance.put(`/compatibility-details/${id}`, data),

  // DELETE DETAILS (ADMIN)
  deleteDetails: (id: number) => axiosInstance.delete(`/compatibility-details/${id}`),
};
