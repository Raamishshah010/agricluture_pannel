import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, XCircle } from "lucide-react";
import service from "../../services/farmerService";
import { toast } from "react-toastify";
import useTranslation from "../../hooks/useTranslation";
import Loader from "../../components/Loader";

export default function FarmerApprovals() {
  const t = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await service.getPendingApprovals();
      setList(res?.data?.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || t("farmers.farmerApprovals.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const haystack = [
        item.name,
        item.email,
        item.phoneNumber,
        item.emirateId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [list, query]);

  const formatDate = (dateString) => {
    if (!dateString) return t("common.nA");
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDecision = async (item, action) => {
    const confirmKey =
      action === "approve"
        ? "farmers.farmerApprovals.approveConfirm"
        : "farmers.farmerApprovals.rejectConfirm";
    const confirmed = window.confirm(t(confirmKey));
    if (!confirmed) return;

    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: action }));
      const res = await service.updateApprovalStatus(item.id, { action });
      toast.success(
        action === "approve"
          ? t("farmers.farmerApprovals.approveSuccess")
          : t("farmers.farmerApprovals.rejectSuccess"),
      );
      setList((prev) => prev.filter((entry) => entry.id !== item.id));
      return res;
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (action === "approve"
            ? t("farmers.farmerApprovals.approveFail")
            : t("farmers.farmerApprovals.rejectFail")),
      );
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {t("farmers.farmerApprovals.title")}
              </h1>
              <p className="text-sm text-gray-500">{t("farmers.farmerApprovals.subtitle")}</p>
            </div>

            <div className="w-full lg:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("farmers.farmerApprovals.searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200">
              <Clock3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                {t("farmers.farmerApprovals.statusLabel")}
              </p>
              <p className="text-3xl font-bold text-gray-900">{filteredList.length}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t("farmers.farmerApprovals.pendingCount")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <Loader />
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Clock3 className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{t("farmers.farmerApprovals.emptyState")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("farmers.farmers.name")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("farmers.farmers.phoneNumber")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("farmers.farmers.emirateId")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("farmers.farmers.createdAt")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("farmers.farmerApprovals.statusLabel")}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("common.components.farmCoding.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredList.map((item) => {
                    const isBusy = !!actionLoading[item.id];
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.phoneNumber || t("common.nA")}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200 whitespace-nowrap">
                            {item.emirateId || t("common.nA")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-semibold text-amber-700 border border-amber-200 whitespace-nowrap">
                            {t("farmers.farmerApprovals.pendingBadge")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleDecision(item, "approve")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {t("common.components.farmCoding.approve")}
                            </button>
                            <button
                              onClick={() => handleDecision(item, "reject")}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <XCircle className="w-4 h-4" />
                              {t("common.components.farmCoding.reject")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
