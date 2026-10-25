export const ml = {
  appTitle: 'കലണ്ടർ വിൽപന മാനേജ്‌മെന്റ് സിസ്റ്റം',
  appSubtitle: '7 ദിവസത്തെ കലണ്ടർ വിൽപന ട്രാക്കിംഗ് & റാങ്കിംഗ്',

  // Navigation
  nav: {
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    dailySales: 'ദിവസേനയുള്ള വിൽപന',
    day1: 'ദിവസം 1',
    day2: 'ദിവസം 2',
    day3: 'ദിവസം 3',
    day4: 'ദിവസം 4',
    day5: 'ദിവസം 5',
    day6: 'ദിവസം 6',
    day7: 'ദിവസം 7',
    summary: 'ആകെ സംഗ്രഹം',
    leaderboard: 'കുട്ടികളുടെ ആകെ കണക്ക്',
    camps: 'ടീം ക്യാമ്പുകൾ',
    students: 'കുട്ടികളുടെ പട്ടിക',
    campaigns: 'ക്യാമ്പയിനുകൾ',
    users: 'ഉപയോക്താക്കൾ',
    auditLogs: 'ഓഡിറ്റ് ലോഗുകൾ',
    logout: 'ലോഗ് ഔട്ട്',
  },

  // Roles
  roles: {
    ADMIN: 'അഡ്മിനിസ്ട്രേറ്റർ (Admin)',
    OPERATOR: 'ഡാറ്റാ എൻട്രി ഓപ്പറേറ്റർ (Operator)',
    VIEWER: 'നിരീക്ഷകൻ (Viewer)',
  },

  // Day 1 Columns
  day1Cols: {
    studentName: 'കുട്ടിയുടെ പേര്',
    target: 'ടാർഗറ്റ്',
    taken: 'കൊണ്ടുപോയ കലണ്ടർ',
    sold: 'വിറ്റ കലണ്ടർ',
    remainingCalendars: 'ബാക്കി കലണ്ടർ',
    cashReceived: 'ലഭിച്ച കാശ്',
    expenses: 'ചെലവ്',
    netCash: 'ബാക്കി കാശ്',
    average: 'ശരാശരി',
  },

  // Days 2-7 Columns
  daysCols: {
    studentName: 'കുട്ടിയുടെ പേര്',
    target: 'ടാർഗറ്റ്',
    targetRemaining: 'ടാർഗറ്റിൽ ബാക്കി',
    taken: 'കൊണ്ടുപോയ കലണ്ടർ',
    sold: 'വിറ്റ കലണ്ടർ',
    remainingCalendars: 'ബാക്കി കലണ്ടർ',
    cumulativeSold: 'ആകെ വിറ്റ കലണ്ടർ',
    cashReceived: 'ലഭിച്ച കാശ്',
    expenses: 'ചെലവ്',
    netCash: 'ബാക്കി കാശ്',
    average: 'ശരാശരി',
    cumulativeNetCash: 'ആകെ ബാക്കി',
    cumulativeAverage: 'ആകെ ശരാശരി',
  },

  // Ranking Columns
  rankingCols: {
    rank: 'റാങ്ക്',
    studentName: 'കുട്ടിയുടെ പേര്',
    sold: 'വിറ്റ കലണ്ടർ',
    cashReceived: 'ലഭിച്ച കാശ്',
    expenses: 'ചെലവ്',
    netCash: 'ബാക്കി കാശ്',
    average: 'ശരാശരി',
    cumulativeSold: 'ആകെ വിറ്റ കലണ്ടർ',
    cumulativeNetCash: 'ആകെ ബാക്കി',
  },

  // Summary Table Columns
  summaryCols: {
    day: 'ദിവസം',
    totalSold: 'ആകെ വിറ്റ കലണ്ടർ',
    totalRemaining: 'ആകെ ബാക്കി കലണ്ടർ',
    cashReceived: 'ലഭിച്ച കാശ്',
    expenses: 'ചെലവ്',
    dailyNetCash: 'അന്നത്തെ ബാക്കി കാശ്',
    cumulativeNetCash: 'ആകെ ബാക്കി കാശ്',
  },

  // Common Table & Form
  common: {
    total: 'ആകെ (SUM)',
    actions: 'നടപടികൾ',
    save: 'സേവ് ചെയ്യുക',
    saving: 'സേവ് ചെയ്യുന്നു...',
    saved: 'വിജയകരമായി സേവ് ചെയ്തു!',
    saveError: 'സേവ് ചെയ്യുന്നതിൽ പിഴവ് സംഭവിച്ചു',
    edit: 'തിരുത്തുക',
    delete: 'നീക്കം ചെയ്യുക',
    cancel: 'റദ്ദാക്കുക',
    confirm: 'ഉറപ്പാക്കുക',
    search: 'തിരയുക...',
    filter: 'ഫിൽട്ടർ',
    exportExcel: 'Excel എക്സ്പോർട്ട്',
    exportPdf: 'PDF റിപ്പോർട്ട്',
    print: 'പ്രിന്റ് ചെയ്യുക',
    tableAHeading: 'ടേബിൾ A: ദിവസേനയുള്ള വിവരങ്ങൾ രേഖപ്പെടുത്തൽ (Data Entry)',
    tableBHeading: 'ടേബിൾ B: അന്നത്തെ ബാക്കി കാശ് അടിസ്ഥാനമാക്കിയുള്ള റാങ്കിംഗ് (Ranking)',
    tableBSubheading: 'ശ്രദ്ധിക്കുക: ബാക്കി കാശ് (Net Cash) അടിസ്ഥാനമാക്കി റാങ്ക് തനിയെ ക്രമീകരിക്കപ്പെടുന്നു.',
    studentCode: 'റോൾ നമ്പർ / കോഡ്',
    currency: '₹',
    noData: 'വിവരങ്ങൾ ലഭ്യമല്ല',
    active: 'സജീവം',
    inactive: 'നിഷ്‌ക്രിയം',
    importExcel: 'Excel-ൽ നിന്ന് ഇറക്കുമതി ചെയ്യുക',
    downloadTemplate: 'മാതൃക ഡൗൺലോഡ് ചെയ്യുക',
    expectedCash: 'പ്രതീക്ഷിച്ച തുക',
    difference: 'വ്യത്യാസം (റീകൺസിലിയേഷൻ)',
  },

  // Dashboard Cards
  dashboard: {
    totalStudents: 'ആകെ കുട്ടികൾ',
    totalTarget: 'ആകെ ടാർഗറ്റ് കലണ്ടറുകൾ',
    totalTaken: 'കൊണ്ടുപോയ കലണ്ടറുകൾ',
    totalSold: 'ആകെ വിറ്റ കലണ്ടറുകൾ',
    stockRemaining: 'ബാക്കി സ്റ്റോക്ക്',
    totalCashReceived: 'ആകെ ലഭിച്ച കാശ്',
    totalExpenses: 'ആകെ ചെലവ്',
    totalNetCash: 'ആകെ ബാക്കി കാശ് (Net)',
    progress: 'വിൽപ്പന പുരോഗതി',
    completedTargetStudents: 'ടാർഗറ്റ് പൂർത്തിയാക്കിയവർ',
    remainingTargetStudents: 'ടാർഗറ്റ് ബാക്കിയുള്ളവർ',
    topStudents: 'മുൻനിര വിദ്യാർത്ഥികൾ',
    highestDailyNetCash: 'ഏറ്റവും ഉയർന്ന അന്നത്തെ ബാക്കി കാശ്',
    dailyTrend: 'ദിവസേനയുള്ള പുരോഗതി',
  },

  // Warnings
  warnings: {
    soldExceedsTaken: 'ശ്രദ്ധിക്കുക: വിറ്റ കലണ്ടർ കൊണ്ടുപോയതിനേക്കാൾ കൂടുതലാണ്!',
    soldExceedsTarget: 'അഭിനന്ദനം: കുട്ടി നിശ്ചയിച്ച ടാർഗറ്റിൽ കൂടുതൽ വിറ്റു!',
    negativeRemaining: 'ശ്രദ്ധിക്കുക: ബാക്കി കലണ്ടർ പൂജ്യത്തിലും കുറവാണ്!',
    unsavedChanges: 'മാറ്റങ്ങൾ സേവ് ചെയ്തിട്ടില്ല. പുറത്തുകടക്കണോ?',
  },
};
