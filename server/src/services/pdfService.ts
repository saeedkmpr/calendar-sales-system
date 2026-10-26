export class PdfService {
  /**
   * Generates a printable HTML document with embedded Noto Sans Malayalam font
   * that renders Malayalam Unicode flawlessly and triggers auto-print / PDF export.
   */
  static generateDayPrintHtml(
    campaign: any,
    dayNumber: number,
    entryRows: any[],
    entryTotals: any,
    rankingRows: any[],
    rankingTotals: any
  ): string {
    const isDay1 = dayNumber === 1;

    const entryHeaders = isDay1
      ? ['റോൾ നമ്പർ', 'കുട്ടിയുടെ പേര്', 'ടാർഗറ്റ്', 'കൊണ്ടുപോയത്', 'വിറ്റത്', 'ബാക്കി', 'ലഭിച്ച കാശ്', 'ചെലവ്', 'ബാക്കി കാശ്', 'ശരാശരി']
      : ['റോൾ നമ്പർ', 'കുട്ടിയുടെ പേര്', 'ടാർഗറ്റ്', 'ടാർഗറ്റിൽ ബാക്കി', 'കൊണ്ടുപോയത്', 'വിറ്റത്', 'ബാക്കി', 'ആകെ വിറ്റത്', 'ലഭിച്ച കാശ്', 'ചെലവ്', 'ബാക്കി കാശ്', 'ശരാശരി', 'ആകെ ബാക്കി', 'ആകെ ശരാശരി'];

    const rankingHeaders = isDay1
      ? ['റാങ്ക്', 'കുട്ടിയുടെ പേര്', 'വിറ്റ കലണ്ടർ', 'ലഭിച്ച കാശ്', 'ചെലവ്', 'ബാക്കി കാശ്', 'ശരാശരി']
      : ['റാങ്ക്', 'കുട്ടിയുടെ പേര്', 'വിറ്റ കലണ്ടർ', 'ലഭിച്ച കാശ്', 'ചെലവ്', 'ബാക്കി കാശ്', 'ശരാശരി', 'ആകെ വിറ്റ കലണ്ടർ', 'ആകെ ബാക്കി'];

    const entryTableRows = entryRows.map((r) => {
      if (isDay1) {
        return `<tr>
          <td>${r.studentCode}</td>
          <td style="text-align: left; font-weight: 500;">${r.studentName}</td>
          <td>${r.target}</td>
          <td>${r.calendarsTaken}</td>
          <td>${r.calendarsSold}</td>
          <td>${r.remainingCalendars}</td>
          <td>₹${r.cashReceived}</td>
          <td>₹${r.expenses}</td>
          <td style="font-weight: 600;">₹${r.netCash}</td>
          <td>₹${r.average}</td>
        </tr>`;
      } else {
        return `<tr>
          <td>${r.studentCode}</td>
          <td style="text-align: left; font-weight: 500;">${r.studentName}</td>
          <td>${r.target}</td>
          <td>${r.targetRemaining}</td>
          <td>${r.calendarsTaken}</td>
          <td>${r.calendarsSold}</td>
          <td>${r.remainingCalendars}</td>
          <td>${r.cumulativeSold}</td>
          <td>₹${r.cashReceived}</td>
          <td>₹${r.expenses}</td>
          <td style="font-weight: 600;">₹${r.netCash}</td>
          <td>₹${r.average}</td>
          <td style="font-weight: 600;">₹${r.cumulativeNetCash}</td>
          <td>₹${r.cumulativeAverage}</td>
        </tr>`;
      }
    }).join('');

    const entryTotalRow = isDay1
      ? `<tr class="total-row">
          <td colspan="2">ആകെ (SUM)</td>
          <td>${entryTotals.target}</td>
          <td>${entryTotals.calendarsTaken}</td>
          <td>${entryTotals.calendarsSold}</td>
          <td>${entryTotals.remainingCalendars}</td>
          <td>₹${entryTotals.cashReceived}</td>
          <td>₹${entryTotals.expenses}</td>
          <td>₹${entryTotals.netCash}</td>
          <td>₹${entryTotals.average}</td>
        </tr>`
      : `<tr class="total-row">
          <td colspan="2">ആകെ (SUM)</td>
          <td>${entryTotals.target}</td>
          <td>${entryTotals.targetRemaining || 0}</td>
          <td>${entryTotals.calendarsTaken}</td>
          <td>${entryTotals.calendarsSold}</td>
          <td>${entryTotals.remainingCalendars}</td>
          <td>${entryTotals.cumulativeSold || 0}</td>
          <td>₹${entryTotals.cashReceived}</td>
          <td>₹${entryTotals.expenses}</td>
          <td>₹${entryTotals.netCash}</td>
          <td>₹${entryTotals.average}</td>
          <td>₹${entryTotals.cumulativeNetCash || 0}</td>
          <td>₹${entryTotals.cumulativeAverage || 0}</td>
        </tr>`;

    const rankingTableRows = rankingRows.map((r) => {
      if (isDay1) {
        return `<tr>
          <td style="font-weight: 700;">#${r.rank}</td>
          <td style="text-align: left; font-weight: 500;">${r.studentName}</td>
          <td>${r.calendarsSold}</td>
          <td>₹${r.cashReceived}</td>
          <td>₹${r.expenses}</td>
          <td style="font-weight: 700; color: #047857;">₹${r.netCash}</td>
          <td>₹${r.average}</td>
        </tr>`;
      } else {
        return `<tr>
          <td style="font-weight: 700;">#${r.rank}</td>
          <td style="text-align: left; font-weight: 500;">${r.studentName}</td>
          <td>${r.calendarsSold}</td>
          <td>₹${r.cashReceived}</td>
          <td>₹${r.expenses}</td>
          <td style="font-weight: 700; color: #047857;">₹${r.netCash}</td>
          <td>₹${r.average}</td>
          <td>${r.cumulativeSold || 0}</td>
          <td style="font-weight: 600;">₹${r.cumulativeNetCash || 0}</td>
        </tr>`;
      }
    }).join('');

    const rankingTotalRow = isDay1
      ? `<tr class="total-row">
          <td colspan="2">ആകെ (SUM)</td>
          <td>${rankingTotals.calendarsSold}</td>
          <td>₹${rankingTotals.cashReceived}</td>
          <td>₹${rankingTotals.expenses}</td>
          <td>₹${rankingTotals.netCash}</td>
          <td>₹${rankingTotals.weightedAverage}</td>
        </tr>`
      : `<tr class="total-row">
          <td colspan="2">ആകെ (SUM)</td>
          <td>${rankingTotals.calendarsSold}</td>
          <td>₹${rankingTotals.cashReceived}</td>
          <td>₹${rankingTotals.expenses}</td>
          <td>₹${rankingTotals.netCash}</td>
          <td>₹${rankingTotals.weightedAverage}</td>
          <td>${rankingTotals.cumulativeSold || 0}</td>
          <td>₹${rankingTotals.cumulativeNetCash || 0}</td>
        </tr>`;

    return `<!DOCTYPE html>
<html lang="ml">
<head>
  <meta charset="UTF-8">
  <title>${campaign.name} - ദിവസം ${dayNumber} റിപ്പോർട്ട്</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: landscape; margin: 12mm; }
    body {
      font-family: 'Noto Sans Malayalam', sans-serif;
      margin: 0;
      padding: 10px;
      color: #1e293b;
      background: #fff;
      font-size: 11px;
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 8px;
    }
    .header h1 { margin: 0; font-size: 20px; color: #0f766e; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 13px; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      margin: 18px 0 8px 0;
      color: #1e293b;
      padding: 4px 8px;
      background: #f1f5f9;
      border-left: 4px solid #0f766e;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      text-align: center;
    }
    th {
      background: #334155;
      color: white;
      font-weight: 600;
      font-size: 10.5px;
    }
    .ranking-th {
      background: #065f46;
    }
    .total-row {
      background: #e2e8f0;
      font-weight: 700;
    }
    .page-break { page-break-before: always; }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #86efac; padding: 12px 18px; border-radius: 8px;">
    <div style="font-size: 13px; color: #166534;">
      <strong>📄 PDF ഫയൽ ആയി സേവ് ചെയ്യാൻ:</strong> താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. Print വിൻഡോയിൽ <strong>Destination: "Save as PDF"</strong> തിരഞ്ഞെടുത്ത് സേവ് ചെയ്യുക.
    </div>
    <button onclick="window.print()" style="padding: 9px 18px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
      🖨️ പ്രിന്റ് / Save as PDF
    </button>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>

  <div class="header">
    <h1>${campaign.name}</h1>
    ${campaign.institutionName ? `<p>${campaign.institutionName}</p>` : ''}
    <p><strong>ദിവസം ${dayNumber} — വിൽപ്പന & റാങ്കിംഗ് റിപ്പോർട്ട്</strong> | കലണ്ടർ വില: ₹${campaign.calendarPrice}</p>
  </div>

  <div class="section-title">ടേബിൾ A: ദിവസേനയുള്ള വിവരങ്ങൾ (Data Entry Table)</div>
  <table>
    <thead>
      <tr>${entryHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${entryTableRows}
      ${entryTotalRow}
    </tbody>
  </table>

  <div class="page-break"></div>

  <div class="section-title">ടേബിൾ B: അന്നത്തെ ബാക്കി കാശ് അടിസ്ഥാനമാക്കിയുള്ള റാങ്കിംഗ് (Ranking Table)</div>
  <table>
    <thead>
      <tr>${rankingHeaders.map(h => `<th class="ranking-th">${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rankingTableRows}
      ${rankingTotalRow}
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Generates a printable HTML document for the 7-day overall summary (ആകെ സംഗ്രഹം)
   */
  static generateSummaryPrintHtml(
    campaign: any,
    dailySummaries: any[],
    totals: any
  ): string {
    const rows = dailySummaries.map((d) => `
      <tr>
        <td style="font-weight: 600;">${d.dayLabel}</td>
        <td>${d.calendarsSold}</td>
        <td>${d.remainingCalendars}</td>
        <td>₹${d.cashReceived}</td>
        <td>₹${d.expenses}</td>
        <td style="font-weight: 600; color: #047857;">₹${d.dailyNetCash}</td>
        <td style="font-weight: 700; color: #0f766e;">₹${d.cumulativeNetCash}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ml">
<head>
  <meta charset="UTF-8">
  <title>${campaign.name} - ആകെ സംഗ്രഹം</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: portrait; margin: 15mm; }
    body {
      font-family: 'Noto Sans Malayalam', sans-serif;
      margin: 0;
      padding: 15px;
      color: #1e293b;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 12px;
    }
    .header h1 { margin: 0; font-size: 22px; color: #0f766e; }
    .header p { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
    .cards {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
    }
    .card {
      flex: 1;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      text-align: center;
    }
    .card .title { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .card .value { font-size: 18px; font-weight: 700; color: #0f766e; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: center;
      font-size: 13px;
    }
    th {
      background: #334155;
      color: white;
      font-weight: 600;
    }
    .total-row {
      background: #e2e8f0;
      font-weight: 700;
      font-size: 14px;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #86efac; padding: 12px 18px; border-radius: 8px;">
    <div style="font-size: 13px; color: #166534;">
      <strong>📄 PDF ഫയൽ ആയി സേവ് ചെയ്യാൻ:</strong> താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. Print വിൻഡോയിൽ <strong>Destination: "Save as PDF"</strong> തിരഞ്ഞെടുത്ത് സേവ് ചെയ്യുക.
    </div>
    <button onclick="window.print()" style="padding: 9px 18px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
      🖨️ പ്രിന്റ് / Save as PDF
    </button>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>

  <div class="header">
    <h1>${campaign.name}</h1>
    ${campaign.institutionName ? `<p>${campaign.institutionName}</p>` : ''}
    <p><strong>${campaign.durationDays || 7} ദിവസത്തെ ആകെ സംഗ്രഹം (Overall ${campaign.durationDays || 7}-Day Campaign Summary)</strong></p>
  </div>

  <div class="cards">
    <div class="card">
      <div class="title">ആകെ വിറ്റ കലണ്ടർ</div>
      <div class="value">${totals.totalSold}</div>
    </div>
    <div class="card">
      <div class="title">ബാക്കി സ്റ്റോക്ക്</div>
      <div class="value">${totals.currentStockRemaining}</div>
    </div>
    <div class="card">
      <div class="title">ആകെ ലഭിച്ച കാശ്</div>
      <div class="value">₹${totals.totalCashReceived}</div>
    </div>
    <div class="card">
      <div class="title">ആകെ ചെലവ്</div>
      <div class="value">₹${totals.totalExpenses}</div>
    </div>
    <div class="card">
      <div class="title">ആകെ ബാക്കി കാശ് (Net Cash)</div>
      <div class="value" style="color: #047857;">₹${totals.totalNetCash}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>ദിവസം</th>
        <th>ആകെ വിറ്റ കലണ്ടർ</th>
        <th>ആകെ ബാക്കി കലണ്ടർ</th>
        <th>ലഭിച്ച കാശ്</th>
        <th>ചെലവ്</th>
        <th>അന്നത്തെ ബാക്കി കാശ്</th>
        <th>ആകെ ബാക്കി കാശ്</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td>ആകെ തുക</td>
        <td>${totals.totalSold}</td>
        <td>${totals.currentStockRemaining}</td>
        <td>₹${totals.totalCashReceived}</td>
        <td>₹${totals.totalExpenses}</td>
        <td>₹${totals.totalNetCash}</td>
        <td>₹${totals.totalNetCash}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Generates a printable HTML document for the Student Leaderboard
   */
  static generateLeaderboardPrintHtml(
    campaign: any,
    rows: any[],
    totals: any
  ): string {
    const tableRows = rows.map((r) => `<tr>
      <td style="font-weight: 700;">#${r.rank}</td>
      <td>${r.studentCode}</td>
      <td style="text-align: left; font-weight: 600;">${r.studentName}</td>
      <td>${r.target}</td>
      <td>${r.targetRemaining}</td>
      <td>${r.totalTaken}</td>
      <td>${r.totalSold}</td>
      <td>${r.remainingStock}</td>
      <td>₹${r.totalCashReceived}</td>
      <td>₹${r.totalExpenses}</td>
      <td style="font-weight: 700; color: #047857;">₹${r.totalNetCash}</td>
      <td>₹${r.average}</td>
    </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="ml">
<head>
  <meta charset="utf-8" />
  <title>${campaign.name} — കുട്ടികളുടെ ആകെ കണക്ക്</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: landscape; margin: 10mm; }
    body {
      font-family: 'Noto Sans Malayalam', sans-serif;
      margin: 0;
      padding: 10px;
      color: #1e293b;
      background: #fff;
      font-size: 10.5px;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 6px;
    }
    .header h1 { margin: 0; font-size: 19px; color: #0f766e; }
    .header p { margin: 3px 0 0 0; color: #64748b; font-size: 12px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: center;
    }
    th {
      background: #065f46;
      color: white;
      font-weight: 600;
    }
    .total-row {
      background: #f1f5f9;
      font-weight: 700;
      border-top: 2px solid #0f766e;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #86efac; padding: 10px 16px; border-radius: 8px;">
    <div style="font-size: 12px; color: #166534;">
      <strong>📄 PDF ഫയൽ ആയി സേവ് ചെയ്യാൻ:</strong> Print വിൻഡോയിൽ <strong>Destination: "Save as PDF"</strong> തിരഞ്ഞെടുത്ത് സേവ് ചെയ്യുക.
    </div>
    <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 700;">
      🖨️ പ്രിന്റ് / Save as PDF
    </button>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>

  <div class="header">
    <h1>${campaign.name}</h1>
    ${campaign.institutionName ? `<p>${campaign.institutionName}</p>` : ''}
    <p><strong>കുട്ടികളുടെ ആകെ കണക്കും റാങ്കിംഗും (Student Leaderboard)</strong> | കലണ്ടർ വില: ₹${campaign.calendarPrice}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>റാങ്ക്</th>
        <th>റോൾ നമ്പർ</th>
        <th>കുട്ടിയുടെ പേര്</th>
        <th>ടാർഗറ്റ്</th>
        <th>ടാർഗറ്റിൽ ബാക്കി</th>
        <th>ആകെ കൊണ്ടുപോയത്</th>
        <th>ആകെ വിറ്റത്</th>
        <th>ബാക്കി സ്റ്റോക്ക്</th>
        <th>ആകെ ലഭിച്ച കാശ്</th>
        <th>ആകെ ചെലവ്</th>
        <th>ആകെ ബാക്കി കാശ്</th>
        <th>ശരാശരി</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td colspan="3">ആകെ (SUM)</td>
        <td>${totals.totalTarget}</td>
        <td>${totals.totalTargetRemaining}</td>
        <td>${totals.totalTaken}</td>
        <td>${totals.totalSold}</td>
        <td>${totals.totalRemainingStock}</td>
        <td>₹${totals.totalCashReceived}</td>
        <td>₹${totals.totalExpenses}</td>
        <td>₹${totals.totalNetCash}</td>
        <td>₹${totals.weightedAverage}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Generates a printable HTML document for an individual Team Camp (e.g. Alappuzha, Kannur)
   */
  static generateCampPrintHtml(
    campaign: any,
    camp: any,
    students: any[],
    totals: any
  ): string {
    const tableRows = students.map((s) => `<tr>
      <td style="font-weight: 700;">#${s.rank}</td>
      <td>${s.studentCode}</td>
      <td style="text-align: left; font-weight: 600;">${s.studentName}</td>
      <td>${s.target}</td>
      <td>${s.targetRemaining}</td>
      <td>${s.calendarsTaken}</td>
      <td>${s.calendarsSold}</td>
      <td>${s.remainingStock}</td>
      <td>₹${s.cashReceived}</td>
      <td>₹${s.expenses}</td>
      <td style="font-weight: 700; color: #047857;">₹${s.netCash}</td>
      <td>₹${s.average}</td>
      <td>${s.progressPercentage}%</td>
    </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="ml">
<head>
  <meta charset="utf-8" />
  <title>${campaign.name} — ${camp.name} ക്യാമ്പ് റിപ്പോർട്ട്</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: landscape; margin: 10mm; }
    body {
      font-family: 'Noto Sans Malayalam', sans-serif;
      margin: 0;
      padding: 10px;
      color: #1e293b;
      background: #fff;
      font-size: 10.5px;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 6px;
    }
    .header h1 { margin: 0; font-size: 20px; color: #0f766e; }
    .header p { margin: 3px 0 0 0; color: #64748b; font-size: 12px; }
    .camp-info-bar {
      display: flex;
      justify-content: space-between;
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 8px 14px;
      border-radius: 6px;
      margin-bottom: 14px;
      font-size: 12px;
      font-weight: 600;
    }
    .kpi-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      flex: 1;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 8px;
      border-radius: 6px;
      text-align: center;
    }
    .kpi-card .lbl { font-size: 10px; color: #64748b; margin-bottom: 2px; }
    .kpi-card .val { font-size: 14px; font-weight: 700; color: #0f766e; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      text-align: center;
    }
    th {
      background: #065f46;
      color: white;
      font-weight: 600;
      font-size: 10px;
    }
    .total-row {
      background: #f1f5f9;
      font-weight: 700;
      border-top: 2px solid #0f766e;
    }
    .sign-row {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      padding: 0 30px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${campaign.name}</h1>
    ${campaign.institutionName ? `<p>${campaign.institutionName}</p>` : ''}
    <p><strong>${camp.name} ടീം ക്യാമ്പ് — ഔദ്യോഗിക റിപ്പോർട്ട് (Official Camp Report)</strong></p>
  </div>

  <div class="camp-info-bar">
    <span>🏕️ ക്യാമ്പ്: <strong>${camp.name}</strong></span>
    ${camp.location ? `<span>📍 സ്ഥലം: <strong>${camp.location}</strong></span>` : ''}
    ${camp.leaderName ? `<span>👤 ഇൻചാർജ്: <strong>${camp.leaderName}</strong></span>` : ''}
    <span>👥 ആകെ കുട്ടികൾ: <strong>${students.length}</strong></span>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="lbl">ലക്ഷ്യം (Target)</div>
      <div class="val">${totals.totalTarget}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">കൊണ്ടുപോയത്</div>
      <div class="val">${totals.totalTaken}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">വിറ്റ കലണ്ടർ</div>
      <div class="val">${totals.totalSold}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">ബാക്കി സ്റ്റോക്ക്</div>
      <div class="val">${totals.totalRemainingStock}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">ലഭിച്ച തുക</div>
      <div class="val">₹${totals.totalCashReceived}</div>
    </div>
    <div class="kpi-card">
      <div class="lbl">ചിലവ്</div>
      <div class="val">₹${totals.totalExpenses}</div>
    </div>
    <div class="kpi-card" style="background: #ecfdf5; border-color: #a7f3d0;">
      <div class="lbl" style="color: #065f46; font-weight: 700;">ആകെ തുക (Net Cash)</div>
      <div class="val" style="color: #047857;">₹${totals.totalNetCash}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>റാങ്ക്</th>
        <th>കോഡ്</th>
        <th>വിദ്യാർത്ഥിയുടെ പേര്</th>
        <th>ലക്ഷ്യം</th>
        <th>ബാക്കി ലക്ഷ്യം</th>
        <th>കൊണ്ടുപോയത്</th>
        <th>വിറ്റത്</th>
        <th>സ്റ്റോക്ക്</th>
        <th>ലഭിച്ച തുക</th>
        <th>ചിലവ്</th>
        <th>ആകെ തുക</th>
        <th>ശരാശരി</th>
        <th>പുരോഗതി</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td colspan="3">ആകെ തുക (SUM)</td>
        <td>${totals.totalTarget}</td>
        <td>${totals.totalTargetRemaining}</td>
        <td>${totals.totalTaken}</td>
        <td>${totals.totalSold}</td>
        <td>${totals.totalRemainingStock}</td>
        <td>₹${totals.totalCashReceived}</td>
        <td>₹${totals.totalExpenses}</td>
        <td>₹${totals.totalNetCash}</td>
        <td>₹${totals.weightedAverage}</td>
        <td>${totals.progressPercentage || 0}%</td>
      </tr>
    </tbody>
  </table>

  <div class="sign-row">
    <div>തയ്യാറാക്കിയത്: .......................................</div>
    <div>ക്യാമ്പ് ലീഡർ ഒപ്പ്: .......................................</div>
    <div>ജനറൽ കൺവീനർ: .......................................</div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates a printable HTML document for Non-Camp Students (ക്യാമ്പിൽ ഇല്ലാത്തവർ)
   */
  static generateUnassignedPrintHtml(
    campaign: any,
    students: any[],
    totals: any,
    dailySummary: any[]
  ): string {
    const summaryRows = dailySummary.map((d) => `<tr>
      <td style="font-weight: 700;">${d.dayLabel}</td>
      <td>${d.calendarsSold}</td>
      <td>${d.remainingStock}</td>
      <td>₹${d.cashReceived}</td>
      <td>₹${d.expenses}</td>
      <td style="font-weight: 700; color: #047857;">₹${d.dailyNetCash}</td>
      <td style="font-weight: 700; color: #0f766e;">₹${d.cumulativeNetCash}</td>
      <td>₹${d.average}</td>
    </tr>`).join('');

    const studentRows = students.map((s) => `<tr>
      <td style="font-weight: 700;">#${s.rank}</td>
      <td>${s.studentCode}</td>
      <td style="text-align: left; font-weight: 600;">${s.studentName}</td>
      <td>${s.target}</td>
      <td>${s.targetRemaining}</td>
      <td>${s.calendarsTaken}</td>
      <td>${s.calendarsSold}</td>
      <td>${s.remainingStock}</td>
      <td>₹${s.cashReceived}</td>
      <td>₹${s.expenses}</td>
      <td style="font-weight: 700; color: #047857;">₹${s.netCash}</td>
      <td>₹${s.average}</td>
      <td>${s.progressPercentage}%</td>
    </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="ml">
<head>
  <meta charset="utf-8" />
  <title>${campaign.name} — ക്യാമ്പിൽ ഇല്ലാത്ത വിദ്യാർത്ഥികളുടെ റിപ്പോർട്ട്</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: landscape; margin: 10mm; }
    body {
      font-family: 'Noto Sans Malayalam', sans-serif;
      margin: 0;
      padding: 10px;
      color: #1e293b;
      background: #fff;
      font-size: 10.5px;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #b45309;
      padding-bottom: 6px;
    }
    .header h1 { margin: 0; font-size: 20px; color: #b45309; }
    .header p { margin: 3px 0 0 0; color: #64748b; font-size: 12px; }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      margin: 14px 0 6px 0;
      color: #1e293b;
      padding: 3px 6px;
      background: #fef3c7;
      border-left: 4px solid #b45309;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: center;
    }
    th {
      background: #78350f;
      color: white;
      font-weight: 600;
    }
    .total-row {
      background: #fef3c7;
      font-weight: 700;
    }
    .page-break { page-break-before: always; }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${campaign.name}</h1>
    ${campaign.institutionName ? `<p>${campaign.institutionName}</p>` : ''}
    <p><strong>ക്യാമ്പിൽ ഇല്ലാത്ത വിദ്യാർത്ഥികളുടെ കണക്കുകൾ (Non-Camp Students Report)</strong> | കുട്ടികൾ: ${students.length}</p>
  </div>

  <div class="section-title">ഭാഗം 1: ദിവസേനയുള്ള വിൽപ്പന പുരോഗതി (Daily Progression Breakdown)</div>
  <table>
    <thead>
      <tr>
        <th>ദിവസം</th>
        <th>വിറ്റത്</th>
        <th>സ്റ്റോക്ക്</th>
        <th>ലഭിച്ച തുക</th>
        <th>ചിലവ്</th>
        <th>ദിവസത്തെ തുക</th>
        <th>ആകെ തുക</th>
        <th>ശരാശരി</th>
      </tr>
    </thead>
    <tbody>
      ${summaryRows}
      <tr class="total-row">
        <td>ആകെ (SUM)</td>
        <td>${totals.totalSold}</td>
        <td>${totals.totalRemainingStock}</td>
        <td>₹${totals.totalCashReceived}</td>
        <td>₹${totals.totalExpenses}</td>
        <td>₹${totals.totalNetCash}</td>
        <td>₹${totals.totalNetCash}</td>
        <td>₹${totals.weightedAverage}</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <div class="section-title">ഭാഗം 2: വിദ്യാർത്ഥികളുടെ സമഗ്ര പട്ടിക & റാങ്കിംഗ് (Students List & Rankings)</div>
  <table>
    <thead>
      <tr>
        <th>റാങ്ക്</th>
        <th>കോഡ്</th>
        <th>വിദ്യാർത്ഥിയുടെ പേര്</th>
        <th>ലക്ഷ്യം</th>
        <th>ബാക്കി ലക്ഷ്യം</th>
        <th>കൊണ്ടുപോയത്</th>
        <th>വിറ്റത്</th>
        <th>സ്റ്റോക്ക്</th>
        <th>ലഭിച്ച തുക</th>
        <th>ചിലവ്</th>
        <th>ആകെ തുക</th>
        <th>ശരാശരി</th>
        <th>പുരോഗതി</th>
      </tr>
    </thead>
    <tbody>
      ${studentRows}
      <tr class="total-row">
        <td colspan="3">ആകെ തുക (SUM)</td>
        <td>${totals.totalTarget}</td>
        <td>${totals.totalTargetRemaining}</td>
        <td>${totals.totalTaken}</td>
        <td>${totals.totalSold}</td>
        <td>${totals.totalRemainingStock}</td>
        <td>₹${totals.totalCashReceived}</td>
        <td>₹${totals.totalExpenses}</td>
        <td>₹${totals.totalNetCash}</td>
        <td>₹${totals.weightedAverage}</td>
        <td>${totals.progressPercentage || 0}%</td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
  }
}
