let craftsmanToken = ''
let adminToken = ''
let dealerToken = ''

export const authStore = {
  getCraftsmanToken: () => craftsmanToken,
  setCraftsmanToken: (token: string) => { craftsmanToken = token },
  clearCraftsmanToken: () => { craftsmanToken = '' },
  getAdminToken: () => adminToken,
  setAdminToken: (token: string) => { adminToken = token },
  clearAdminToken: () => { adminToken = '' },
  getDealerToken: () => dealerToken,
  setDealerToken: (token: string) => { dealerToken = token },
  clearDealerToken: () => { dealerToken = '' },
}
