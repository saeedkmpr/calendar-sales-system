import html2pdf from 'html2pdf.js';

/**
 * Downloads a pixel-perfect, landscape A4 PDF file directly to the user's computer.
 * Preserves Malayalam Unicode fonts and styling without blank pages or popup blockers.
 */
export async function downloadPdfFromHtml(htmlContent: string, filename: string): Promise<void> {
  // Parse the input HTML to cleanly extract styles, title, and body elements
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(htmlContent, 'text/html');

  // Strip no-print elements and scripts so they do not render in PDF
  parsedDoc.querySelectorAll('.no-print, script').forEach((el) => el.remove());

  // Extract all <style> blocks
  const styleTags = Array.from(parsedDoc.querySelectorAll('style'))
    .map((s) => s.innerHTML)
    .join('\n');

  // Scope body styles so they target #pdf-render-target
  const scopedStyles = styleTags.replace(/\bbody\s*\{/g, '#pdf-render-target {');

  // Create loading overlay to provide clear feedback and conceal the renderTarget
  const overlay = document.createElement('div');
  overlay.id = 'pdf-export-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  overlay.style.backdropFilter = 'blur(3px)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.fontFamily = "'Noto Sans Malayalam', sans-serif";
  overlay.innerHTML = `
    <div style="background: #ffffff; color: #1e293b; padding: 24px 36px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); text-align: center; max-width: 440px;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #10b981; border-top-color: transparent; border-radius: 50%; animation: pdf-spin 0.9s linear infinite; margin-bottom: 14px;"></div>
      <div style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: #065f46;">📄 PDF തയ്യാറാക്കുന്നു...</div>
      <div style="font-size: 13px; color: #64748b; line-height: 1.5;">മലയാളം ഫോണ്ടുകളോടെ കൃത്യമായ ഫയൽ സേവ് ചെയ്യപ്പെടുന്നു. ദയവായി അല്പം കാത്തിരിക്കുക.</div>
    </div>
    <style>
      @keyframes pdf-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
  `;

  // Create render target at coordinates (0, 0) inside the viewport
  // Critical fix: must NOT be placed at left: -9999px because html2canvas ignores offscreen negative coordinates!
  const renderTarget = document.createElement('div');
  renderTarget.id = 'pdf-render-target';
  renderTarget.style.position = 'fixed';
  renderTarget.style.top = '0';
  renderTarget.style.left = '0';
  renderTarget.style.width = '1120px';
  renderTarget.style.minHeight = '600px';
  renderTarget.style.background = '#ffffff';
  renderTarget.style.color = '#1e293b';
  renderTarget.style.fontFamily = "'Noto Sans Malayalam', sans-serif";
  renderTarget.style.fontSize = '11px';
  renderTarget.style.zIndex = '99998'; // Positioned immediately beneath the overlay
  renderTarget.style.boxSizing = 'border-box';
  renderTarget.style.padding = '20px';
  renderTarget.style.overflow = 'visible';

  renderTarget.innerHTML = `
    <style>
      ${scopedStyles}
      #pdf-render-target {
        font-family: 'Noto Sans Malayalam', 'Gayathri', sans-serif !important;
        background: #ffffff !important;
        color: #1e293b !important;
        width: 1120px !important;
      }
      #pdf-render-target table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-bottom: 14px !important;
      }
      #pdf-render-target th, #pdf-render-target td {
        border: 1px solid #cbd5e1 !important;
        padding: 5px 6px !important;
        text-align: center !important;
      }
      #pdf-render-target th {
        background: #065f46 !important;
        color: #ffffff !important;
        font-weight: 600 !important;
      }
      #pdf-render-target .total-row {
        background: #f1f5f9 !important;
        font-weight: 700 !important;
        border-top: 2px solid #0f766e !important;
      }
    </style>
    ${parsedDoc.body.innerHTML}
  `;

  document.body.appendChild(renderTarget);
  document.body.appendChild(overlay);

  try {
    // Wait for fonts to be ready in the document
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    // Give browser brief time to layout and paint DOM
    await new Promise((resolve) => setTimeout(resolve, 300));

    const opt = {
      margin: [6, 6, 6, 6] as [number, number, number, number],
      filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        width: 1120,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape' as const,
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    await html2pdf().set(opt).from(renderTarget).save();
  } finally {
    if (document.body.contains(renderTarget)) {
      document.body.removeChild(renderTarget);
    }
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }
}

/**
 * Opens browser print dialog directly inside an invisible iframe.
 * Avoids popup blockers and allows direct native "Save as PDF" with vector text.
 */
export function printFromHtml(htmlContent: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Iframe print error:', e);
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  };

  // Wait for fonts inside the iframe before triggering print
  if (iframe.contentWindow?.document.fonts && iframe.contentWindow.document.fonts.ready) {
    iframe.contentWindow.document.fonts.ready.then(() => {
      setTimeout(triggerPrint, 300);
    });
  } else {
    setTimeout(triggerPrint, 500);
  }
}
