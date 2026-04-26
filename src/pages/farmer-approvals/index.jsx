import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, GitMerge, Search, X, XCircle } from "lucide-react";
import service from "../../services/farmerService";
import { toast } from "react-toastify";
import useTranslation from "../../hooks/useTranslation";
import Loader from "../../components/Loader";
import useStore from "../../store/store";
import { getLocalizedPersonName } from "../../utils/localizedName";

export default function FarmerApprovals() {
  const t = useTranslation();
  const { language } = useStore((state) => state);
  const [list, setList] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [approvalDialogItem, setApprovalDialogItem] = useState(null);
  const [approvalRole, setApprovalRole] = useState("farmer");
  const [mergeIntoFarmerId, setMergeIntoFarmerId] = useState("");
  const [matchDetailsItem, setMatchDetailsItem] = useState(null);

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
        getLocalizedPersonName(item, language),
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
  }, [list, query, activeTab, language]);

  const getFarmerName = (farmer) => getLocalizedPersonName(farmer, language) || t("common.nA");

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
    setMergeIntoFarmerId("");
    setApprovalDialogItem(item);
  };

  const closeApprovalDialog = () => {
    setApprovalDialogItem(null);
    setApprovalRole("farmer");
    setMergeIntoFarmerId("");
  };

  const openMatchDetails = (item) => {
    if (!item?.mergeCandidates?.length) return;
    setMatchDetailsItem(item);
  };

  const closeMatchDetails = () => {
    setMatchDetailsItem(null);
  };

  const handleDecision = async (item, action, role = "farmer") => {
    if (action === "reject") {
      const confirmed = window.confirm(t("farmers.farmerApprovals.rejectConfirm"));
      if (!confirmed) return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [item.id]: action }));
      const payload = action === "approve"
        ? { action, role, ...(mergeIntoFarmerId ? { mergeIntoFarmerId } : {}) }
        : { action };
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t("farmers.farmerApprovals.mergeCandidates")}
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
                          <div className="font-semibold text-gray-900 text-sm">{getFarmerName(item)}</div>
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
                          {item.mergeCandidates?.length ? (
                            <button
                              type="button"
                              onClick={() => openMatchDetails(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700 border border-indigo-200 whitespace-nowrap hover:bg-indigo-100 transition-colors"
                            >
                              <GitMerge className="w-3.5 h-3.5" />
                              {item.mergeCandidates.length}
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">{t("common.nA")}</span>
                          )}
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
                  {getFarmerName(approvalDialogItem)}
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

              {approvalDialogItem.mergeCandidates?.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("farmers.farmerApprovals.mergeLabel")}
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setMergeIntoFarmerId("")}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        !mergeIntoFarmerId
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-sm font-semibold">{t("farmers.farmerApprovals.approveNewAccount")}</div>
                      <div className="text-xs mt-1 text-gray-500">{t("farmers.farmerApprovals.approveNewAccountDescription")}</div>
                    </button>
                    {approvalDialogItem.mergeCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => setMergeIntoFarmerId(candidate.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          mergeIntoFarmerId === candidate.id
                            ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{candidate.name || t("common.nA")}</div>
                            <div className="text-xs mt-1 text-gray-500">{candidate.email || t("common.nA")}</div>
                            <div className="text-xs mt-1 text-gray-500">{candidate.emirateId || t("common.nA")}</div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
                            {candidate.farmsCount || 0} {t("farmers.farmerApprovals.farms")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

      {matchDetailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {t("farmers.farmerApprovals.matchDetailsTitle")}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {t("farmers.farmerApprovals.matchDetailsDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMatchDetails}
                className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("farmers.farmerApprovals.pendingAccount")}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs text-gray-500">{t("farmers.farmers.name")}</div>
                    <div className="text-sm font-semibold text-gray-900">{getFarmerName(matchDetailsItem)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t("farmers.farmers.email")}</div>
                    <div className="text-sm text-gray-700 break-all">{matchDetailsItem.email || t("common.nA")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t("farmers.farmers.phoneNumber")}</div>
                    <div className="text-sm text-gray-700">{matchDetailsItem.phoneNumber || t("common.nA")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{t("farmers.farmers.emirateId")}</div>
                    <div className="text-sm font-semibold text-blue-700">{matchDetailsItem.emirateId || t("common.nA")}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {matchDetailsItem.mergeCandidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-base font-bold text-gray-900">{candidate.name || t("common.nA")}</div>
                        <div className="mt-1 text-xs text-gray-500 break-all">{candidate.id}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {candidate.farmsCount || 0} {t("farmers.farmerApprovals.farms")}
                        </span>
                        <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {candidate.isCoder ? t("farmers.farmerApprovals.coderAccount") : t("farmers.farmerApprovals.farmerAccount")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <div className="text-xs text-gray-500">{t("farmers.farmers.email")}</div>
                        <div className="text-sm text-gray-700 break-all">{candidate.email || t("common.nA")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("farmers.farmers.phoneNumber")}</div>
                        <div className="text-sm text-gray-700">{candidate.phoneNumber || t("common.nA")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("farmers.farmers.emirateId")}</div>
                        <div className="text-sm font-semibold text-blue-700">{candidate.emirateId || t("common.nA")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("farmers.farmers.accountStatus")}</div>
                        <div className="text-sm text-gray-700">{candidate.status || t("common.nA")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("farmers.farmers.approvalStatus")}</div>
                        <div className="text-sm text-gray-700">{candidate.approvalStatus || t("common.nA")}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("farmers.farmers.createdAt")}</div>
                        <div className="text-sm text-gray-700">{formatDate(candidate.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeMatchDetails}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  {t("farmers.farmers.cancel")}
                </button>
                {activeTab === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = matchDetailsItem;
                      closeMatchDetails();
                      openApprovalDialog(item);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    {t("common.components.farmCoding.approve")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
