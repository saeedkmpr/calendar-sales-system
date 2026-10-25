export const en = {
  appTitle: 'Calendar Sales Management System',
  appSubtitle: '7-Day Student Calendar Sales Tracking & Rankings',

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    dailySales: 'Daily Sales',
    day1: 'Day 1',
    day2: 'Day 2',
    day3: 'Day 3',
    day4: 'Day 4',
    day5: 'Day 5',
    day6: 'Day 6',
    day7: 'Day 7',
    summary: 'Overall Summary',
    camps: 'Team Camps',
    leaderboard: 'Student Leaderboard',
    students: 'Student List',
    campaigns: 'Campaigns',
    users: 'Users',
    auditLogs: 'Audit Logs',
    logout: 'Log Out',
  },

  // Roles
  roles: {
    ADMIN: 'Administrator',
    OPERATOR: 'Data Entry Operator',
    VIEWER: 'Viewer',
  },

  // Day 1 Columns
  day1Cols: {
    studentName: 'Student Name',
    target: 'Target',
    taken: 'Calendars Taken',
    sold: 'Calendars Sold',
    remainingCalendars: 'Remaining Calendars',
    cashReceived: 'Cash Received',
    expenses: 'Expenses',
    netCash: 'Net Cash',
    average: 'Average',
  },

  // Days 2-7 Columns
  daysCols: {
    studentName: 'Student Name',
    target: 'Target',
    targetRemaining: 'Remaining Target',
    taken: 'Calendars Taken',
    sold: 'Calendars Sold',
    remainingCalendars: 'Remaining Calendars',
    cumulativeSold: 'Cumulative Sold',
    cashReceived: 'Cash Received',
    expenses: 'Expenses',
    netCash: 'Net Cash',
    average: 'Average',
    cumulativeNetCash: 'Cumulative Net Cash',
    cumulativeAverage: 'Cumulative Average',
  },

  // Ranking Columns
  rankingCols: {
    rank: 'Rank',
    studentName: 'Student Name',
    sold: 'Calendars Sold',
    cashReceived: 'Cash Received',
    expenses: 'Expenses',
    netCash: 'Net Cash',
    average: 'Average',
    cumulativeSold: 'Cumulative Sold',
    cumulativeNetCash: 'Cumulative Net Cash',
  },

  // Summary Table Columns
  summaryCols: {
    day: 'Day',
    totalSold: 'Total Sold Calendars',
    totalRemaining: 'Remaining Stock',
    cashReceived: 'Cash Received',
    expenses: 'Expenses',
    dailyNetCash: 'Daily Net Cash',
    cumulativeNetCash: 'Cumulative Net Cash',
  },

  // Common Table & Form
  common: {
    total: 'Total (SUM)',
    actions: 'Actions',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved successfully!',
    saveError: 'Error saving data',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    confirm: 'Confirm',
    search: 'Search...',
    filter: 'Filter',
    exportExcel: 'Export Excel',
    exportPdf: 'PDF Report',
    print: 'Print',
    tableAHeading: 'Table A: Daily Sales Data Entry',
    tableBHeading: 'Table B: Automatic Daily Net Cash Ranking',
    tableBSubheading: 'Note: Students are automatically ranked by today\'s Net Cash in descending order.',
    studentCode: 'Roll No / Code',
    currency: '₹',
    noData: 'No data available',
    active: 'Active',
    inactive: 'Inactive',
    importExcel: 'Import from Excel / CSV',
    downloadTemplate: 'Download Template',
    expectedCash: 'Expected Cash',
    difference: 'Difference (Reconciliation)',
  },

  // Dashboard Cards
  dashboard: {
    totalStudents: 'Total Students',
    totalTarget: 'Total Target Calendars',
    totalTaken: 'Total Calendars Taken',
    totalSold: 'Total Calendars Sold',
    stockRemaining: 'Remaining Stock',
    totalCashReceived: 'Total Cash Received',
    totalExpenses: 'Total Expenses',
    totalNetCash: 'Total Net Cash',
    progress: 'Sales Progress',
    completedTargetStudents: 'Target Achieved',
    remainingTargetStudents: 'Target Pending',
    topStudents: 'Top Performers',
    highestDailyNetCash: 'Highest Daily Net Cash',
    dailyTrend: 'Daily Progress Trend',
  },

  // Warnings
  warnings: {
    soldExceedsTaken: 'Warning: Calendars sold exceeds calendars taken!',
    soldExceedsTarget: 'Congratulations: Student exceeded assigned target!',
    negativeRemaining: 'Warning: Remaining stock is less than zero!',
    unsavedChanges: 'You have unsaved changes. Are you sure you want to exit?',
  },
};
