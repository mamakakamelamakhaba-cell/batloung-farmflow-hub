// Data hooks for the UI. Every call goes to the MySQL-backed REST API under /api.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const PackagingSize = { SMALL: "SMALL", MEDIUM: "MEDIUM", LARGE: "LARGE" };
export const PaymentMethod = { CASH: "CASH", MOBILE_MONEY: "MOBILE_MONEY", CREDIT: "CREDIT" };
export const FruitStatus = { ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" };

export const API_BASE = (import.meta.env['VITE_API_URL']) ?? "/api";

function getAuthHeaders() {
  const token = localStorage.getItem('bf_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, init) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(init?.headers ?? {}) },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return await response.json();
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) });
const del = (path) => request(path, { method: "DELETE" });

const qs = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") search.set(k, String(v)); });
  const text = search.toString();
  return text ? `?${text}` : "";
};

/** Query keys */
export const getHealthCheckQueryKey = () => ["health"];
export const getGetDashboardSummaryQueryKey = () => ["dashboard", "summary"];
export const getGetDashboardActivityQueryKey = () => ["dashboard", "activity"];
export const getListSuppliersQueryKey = () => ["suppliers"];
export const getGetSupplierQueryKey = (id) => ["supplier", id];
export const getListFruitsQueryKey = () => ["fruits"];
export const getGetFruitQueryKey = (id) => ["fruit", id];
export const getListStockQueryKey = () => ["stock"];
export const getListLowStockQueryKey = (p) => (p ? ["stock-low", p] : ["stock-low"]);
export const getListVendorsQueryKey = (p) => (p ? ["vendors", p] : ["vendors"]);
export const getListVendorBalancesQueryKey = () => ["vendor-balances"];
export const getGetVendorQueryKey = (id) => ["vendor", id];
export const getListPurchasesQueryKey = () => ["purchases"];
export const getListSalesQueryKey = () => ["sales"];
export const getGetTopFruitsReportQueryKey = () => ["reports", "top-fruits"];
export const getGetRevenueReportQueryKey = (p) => (p ? ["reports", "revenue", p] : ["reports", "revenue"]);
export const getGetTopVendorReportQueryKey = () => ["reports", "top-vendor"];
export const getGetStockReportQueryKey = () => ["reports", "stock"];

const useFetch = (queryKey, path, enabled = true) =>
  useQuery({ queryKey, queryFn: () => get(path), enabled, staleTime: 20_000, retry: 1 });

function useWrite(fn, keys) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
}

export const useHealthCheck = () => useFetch(getHealthCheckQueryKey(), "/health");
export const useGetDashboardSummary = () => useFetch(getGetDashboardSummaryQueryKey(), "/dashboard/summary");
export const useGetDashboardActivity = () => useFetch(getGetDashboardActivityQueryKey(), "/dashboard/activity");
export const useListSuppliers = () => useFetch(getListSuppliersQueryKey(), "/suppliers");
export const useGetSupplier = (id) => useFetch(getGetSupplierQueryKey(id), `/suppliers/${id}`, id > 0);
export const useListFruits = () => useFetch(getListFruitsQueryKey(), "/fruits");
export const useGetFruit = (id) => useFetch(getGetFruitQueryKey(id), `/fruits/${id}`, id > 0);
export const useListStock = () => useFetch(getListStockQueryKey(), "/stock");
export const useListLowStock = (p) =>
  useFetch(getListLowStockQueryKey(p), `/stock/low${qs({ threshold: p?.threshold })}`);
export const useListVendors = (p) =>
  useFetch(getListVendorsQueryKey(p), `/vendors${qs({ search: p?.search })}`);
export const useListVendorBalances = () => useFetch(getListVendorBalancesQueryKey(), "/vendors/balances");
export const useGetVendor = (id) => useFetch(getGetVendorQueryKey(id), `/vendors/${id}`, id > 0);
export const useListPurchases = () => useFetch(getListPurchasesQueryKey(), "/purchases");
export const useListSales = () => useFetch(getListSalesQueryKey(), "/sales");
export const useGetTopFruitsReport = () => useFetch(getGetTopFruitsReportQueryKey(), "/reports/top-fruits");
export const useGetRevenueReport = (p) =>
  useFetch(getGetRevenueReportQueryKey(p), `/reports/revenue${qs({ startDate: p.startDate, endDate: p.endDate })}`, !!p.startDate && !!p.endDate);
export const useGetTopVendorReport = () => useFetch(getGetTopVendorReportQueryKey(), "/reports/top-vendor");
export const useGetStockReport = () => useFetch(getGetStockReportQueryKey(), "/reports/stock");

const DATA = [
  getListSuppliersQueryKey(),
  getListFruitsQueryKey(),
  getListStockQueryKey(),
  getListLowStockQueryKey(),
  getListVendorsQueryKey(),
  getListVendorBalancesQueryKey(),
  getListPurchasesQueryKey(),
  getListSalesQueryKey(),
  getGetDashboardSummaryQueryKey(),
  getGetDashboardActivityQueryKey(),
  getGetStockReportQueryKey(),
  getGetTopFruitsReportQueryKey(),
  getGetTopVendorReportQueryKey(),
];

export const useCreateSupplier = () => useWrite((v) => post("/suppliers", v.data), DATA);
export const useUpdateSupplier = () => useWrite((v) => put(`/suppliers/${v.id}`, v.data), DATA);
export const useDeleteSupplier = () => useWrite((v) => del(`/suppliers/${v.id}`), DATA);
export const useCreateFruit = () => useWrite((v) => post("/fruits", v.data), DATA);
export const useUpdateFruit = () => useWrite((v) => put(`/fruits/${v.id}`, v.data), DATA);
export const useCreateVendor = () => useWrite((v) => post("/vendors", v.data), DATA);
export const useUpdateVendor = () => useWrite((v) => put(`/vendors/${v.id}`, v.data), DATA);
export const useCreatePurchase = () => useWrite((v) => post("/purchases", v.data), DATA);
export const useCreateSale = () => useWrite((v) => post("/sales", v.data), DATA);
export const useAddSalePayment = () => useWrite((v) => post(`/sales/${v.id}/payments`, v.data), DATA);
