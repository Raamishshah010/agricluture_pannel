import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Search, XCircle } from "lucide-react";
import service from "../../services/farmerService";
import { toast } from "react-toastify";
import useTranslation from "../../hooks/useTranslation";
import Loader from "../../components/Loader";

export default function FarmerApprovals() {
  const t = useTranslation();
  const [list, setList] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [approvalDialogItem, setApprovalDialogItem] = useState(null);
  const [approvalRole, setApprovalRole] = useState("farmer");

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const status = activeTab === "rejected" ? "rejected" : "pending_approval";
      const res = await service.getPendingApprovals(100, status);
      setList(res?.data?.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || t("farmers.farmerApprovals.loadFail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [activeTab]);

  const filteredList = useMemo(() => {
    const baseList = list.filter((item) => {
      if (activeTab === "rejected") {
        return item.approvalStatus === "rejected";
      }
      return (item.approvalStatus || "pending_approval") === "pending_approval";
    });
    const q = query.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter((item) => {
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
  }, [list, query, activeTab]);

  const formatDate = (dateString) => {
    if (!dateString) return t("common.nA");
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openApprovalDialog = (item) => {
    setApprovalRole("farmer");
    setApprovalDialogItem(item);
  };

  const closeApprovalDialog = () => {
    setApprovalDialogItem(null);
    setApprovalRole("farmer");
  };

  const handleDecision = async (item, action, role = "farmer") => {
    if (action === "reject") {
      const confirmed = window.confirm(t("farmers.farmerApprovals.rejectConfirm"));
      if (!confirmed) return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: action }));
      const payload = action === "approve" ? { action, role } : { action };
      const res = await service.updateApprovalStatus(item.id, payload);
      toast.success(
        action === "approve"
          ? t("farmers.farmerApprovals.approveSuccess")
          : t("farmers.farmerApprovals.rejectSuccess"),
      );
      setList((prev) => prev.filter((entry) => entry.id !== item.id));
      if (action === "approve") {
        closeApprovalDialog();
      }
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
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "pending"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("farmers.farmerApprovals.pendingTab")}
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t("farmers.farmerApprovals.rejectedTab")}
            </button>
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
              <p className="text-gray-500 font-medium">
                {activeTab === "rejected"
                  ? t("farmers.farmerApprovals.emptyRejectedState")
                  : t("farmers.farmerApprovals.emptyState")}
              </p>
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
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${
                            activeTab === "rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {activeTab === "rejected"
                              ? t("farmers.farmerApprovals.rejectedBadge")
                              : t("farmers.farmerApprovals.pendingBadge")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            {activeTab === "pending" && (
                              <>
                                <button
                                  onClick={() => openApprovalDialog(item)}
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
                              </>
                            )}
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

      {approvalDialogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <h2 className="text-xl font-bold text-gray-900">
                {t("farmers.farmerApprovals.approveRoleTitle")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("farmers.farmerApprovals.approveRoleDescription")}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-800">
                  {approvalDialogItem.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">{approvalDialogItem.email}</div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("farmers.farmerApprovals.approveRoleLabel")}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setApprovalRole("farmer")}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${approvalRole === "farmer"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <div className="text-sm font-semibold">{t("farmers.farmerApprovals.approveAsFarmer")}</div>
                    <div className="text-xs mt-1 text-gray-500">{t("farmers.farmerApprovals.approveAsFarmerDescription")}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalRole("coder")}
                    className={`rounded-xl border px-4 py-3 text-left transition-colors ${approvalRole === "coder"
                      ? "border-violet-500 bg-violet-50 text-violet-800"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <div className="text-sm font-semibold">{t("farmers.farmerApprovals.approveAsCoder")}</div>
                    <div className="text-xs mt-1 text-gray-500">{t("farmers.farmerApprovals.approveAsCoderDescription")}</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeApprovalDialog}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                  disabled={!!actionLoading[approvalDialogItem.id]}
                >
                  {t("farmers.farmers.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(approvalDialogItem, "approve", approvalRole)}
                  disabled={!!actionLoading[approvalDialogItem.id]}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("common.components.farmCoding.approve")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
