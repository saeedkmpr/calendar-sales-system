import React, { useState, useEffect } from 'react';
import { X, FileDown, Printer, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { downloadPdfFromHtml, printFromHtml } from '../services/pdfExporter';
import { useLanguage } from '../context/LanguageContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  endpoint: string;
  filename: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title,
  endpoint,
  filename,
}) => {
  const { language } = useLanguage();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !endpoint) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api
      .getText(endpoint)
      .then((html) => {
        if (isMounted) {
          setHtmlContent(html);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || (language === 'en' ? 'Failed to load report' : 'റിപ്പോർട്ട് ലഭ്യമാക്കാൻ കഴിഞ്ഞില്ല'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, endpoint, language]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!htmlContent) return;
    try {
      setIsExportingPdf(true);
      await downloadPdfFromHtml(htmlContent, filename);
    } catch (err: any) {
      alert(err.message || 'PDF ഡൗൺലോഡ് പരാജയപ്പെട്ടു');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!htmlContent) return;
    printFromHtml(htmlContent);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              📄
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold truncate text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {language === 'en' ? 'Official Printable Document Preview' : 'ഔദ്യോഗിക പ്രിന്റബിൾ റിപ്പോർട്ട് രേഖ'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isLoading || isExportingPdf || !htmlContent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
              title={language === 'en' ? 'Download actual PDF file' : 'PDF ഫയലായി ഡൗൺലോഡ് ചെയ്യുക'}
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'Saving...' : (language === 'en' ? 'Download PDF' : 'PDF ഡൗൺലോഡ്')}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isLoading || !htmlContent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold transition-all"
              title={language === 'en' ? 'Print official document' : 'ഔദ്യോഗിക രേഖ പ്രിന്റ് ചെയ്യുക'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>{language === 'en' ? 'Print' : 'പ്രിന്റ്'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Iframe View */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative flex items-center justify-center">
          {isLoading ? (
            <div className="text-center p-8">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                {language === 'en' ? 'Generating official document...' : 'ഔദ്യോഗിക രേഖ തയ്യാറാക്കുന്നു...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-rose-200 max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-sm text-rose-700 font-bold mb-1">{error}</p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                {language === 'en' ? 'Close' : 'അടയ്ക്കുക'}
              </button>
            </div>
          ) : (
            <iframe
              srcDoc={htmlContent}
              title={title}
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};
