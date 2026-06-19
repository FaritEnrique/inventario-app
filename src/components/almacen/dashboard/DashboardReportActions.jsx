// src/components/almacen/dashboard/DashboardReportActions.jsx
import { useCallback, useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import configuracionEmpresaApi from "../../../api/configuracionEmpresaApi";
import {
  buildLetterheadDocumentData,
  resolveInstitutionalAssetUrl,
} from "../../../utils/configuracionEmpresaLetterhead";
import {
  downloadExcelReport,
  printTableReport,
} from "../../../utils/dashboardReportUtils";

const buildFallbackDocumentData = () =>
  buildLetterheadDocumentData({}, "", {
    usePlaceholderIdentity: false,
  });

const DashboardReportActions = ({
  title,
  subtitle,
  rows = [],
  columns = [],
  fileName = "reporte-dashboard",
  sheetName = "Reporte",
  disabled = false,
}) => {
  const [documentData, setDocumentData] = useState(() =>
    buildFallbackDocumentData(),
  );

  const cargarConfiguracionDocumento = useCallback(async () => {
    try {
      const configuracionEmpresa =
        await configuracionEmpresaApi.obtenerDocumento();

      const logoSrc =
        configuracionEmpresa?.logoSrc ||
        resolveInstitutionalAssetUrl(configuracionEmpresa?.logoUrl || "");

      setDocumentData(
        buildLetterheadDocumentData(configuracionEmpresa || {}, logoSrc, {
          usePlaceholderIdentity: Boolean(configuracionEmpresa),
        }),
      );
    } catch {
      setDocumentData(buildFallbackDocumentData());
    }
  }, []);

  useEffect(() => {
    cargarConfiguracionDocumento();
  }, [cargarConfiguracionDocumento]);

  const isDisabled = disabled || rows.length === 0 || columns.length === 0;

  const handleExportExcel = () => {
    downloadExcelReport({
      rows,
      columns,
      fileName,
      sheetName,
    });
  };

  const handlePrint = () => {
    printTableReport({
      title,
      subtitle,
      rows,
      columns,
      documentData,
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleExportExcel}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Excel
      </button>

      <button
        type="button"
        onClick={handlePrint}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Printer className="h-4 w-4" />
        Imprimir
      </button>
    </div>
  );
};

export default DashboardReportActions;
