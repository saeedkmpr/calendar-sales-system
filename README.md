# കലണ്ടർ വിൽപന മാനേജ്‌മെന്റ് സിസ്റ്റം (Calendar Sales Management System)

A production-ready, full-stack web application designed to manage student calendar sales over a 7-day campaign period. It completely replaces error-prone Excel workflows with automated real-time calculations, live rankings, Malayalam Unicode font rendering, audit trails, and multi-format reports (Excel & PDF).

---

## 🌟 Key Features

1. **Malayalam Primary Language**:
   - Comprehensive Malayalam interface with labels, warnings, and reports.
   - Flawless Malayalam Unicode font rendering using Google Fonts (**Noto Sans Malayalam** and **Gayathri**) supporting complex conjuncts (`കൂട്ടക്ഷരങ്ങൾ`, `ചില്ലുകൾ`, `വിരാമം`).
2. **Role-Based Access Control (RBAC)**:
   - **അഡ്മിനിസ്ട്രേറ്റർ (Admin)**: Full control over campaigns, students, targets, sales corrections, user management, and audit logs.
   - **ഡാറ്റാ എൻട്രി ഓപ്പറേറ്റർ (Data Entry Operator)**: Enters and updates daily stock, sales, cash received, and expenses.
   - **നിരീക്ഷകൻ (Viewer)**: Read-only access to dashboards, daily rankings, and summary reports.
3. **Dedicated 7 Daily Sales Pages**:
   - Separate views for **Day 1** through **Day 7**.
   - **Table A (ഡാറ്റാ എൻട്രി)**: Editable table maintaining the original student sequence with tab-key navigation, live validation, and weighted SUM row.
   - **Table B (ഓട്ടോമാറ്റിക് റാങ്കിംഗ്)**: Distinct, read-only table dynamically ranked by that day's **ബാക്കി കാശ് (Net Cash)** in descending order, with consistent tie-breaking and SUM row.
   - **Strict Table Separation**: Table A and Table B are never combined into one wide table.
4. **Calculations & Business Logic**:
   - **Day 1**:
     - $\text{ബാക്കി കലണ്ടർ} = \text{കൊണ്ടുപോയത്} - \text{വിറ്റത്}$
     - $\text{ബാക്കി കാശ്} = \text{ലഭിച്ച കാശ്} - \text{ചെലവ്}$
     - $\text{ശരാശരി} = \text{ബാക്കി കാശ്} / \text{വിറ്റ കലണ്ടർ}$ ($0$ if sold is $0$)
   - **Days 2–7**:
     - $\text{ടാർഗറ്റിൽ ബാക്കി} = \max(0, \text{ടാർഗറ്റ്} - \text{ആകെ വിറ്റ കലണ്ടർ})$
     - $\text{ബാക്കി കലണ്ടർ} = \text{അന്നത്തെ കൊണ്ടുപോയത്} - \text{അന്നത്തെ വിറ്റത്}$
     - $\text{ആകെ വിറ്റ കലണ്ടർ} = \text{മുൻ ദിവസങ്ങളിലെ ആകെ വിറ്റത്} + \text{അന്നത്തെ വിറ്റത്}$
     - $\text{ബാക്കി കാശ്} = \text{അന്നത്തെ ലഭിച്ച കാശ്} - \text{അന്നത്തെ ചെലവ്}$
     - $\text{ആകെ ബാക്കി} = \text{മുൻ ദിവസങ്ങളിലെ ആകെ ബാക്കി} + \text{അന്നത്തെ ബാക്കി കാശ്}$
     - $\text{ആകെ ശരാശരി} = \text{ആകെ ബാക്കി} / \text{ആകെ വിറ്റ കലണ്ടർ}$ ($0$ if sold is $0$)
   - **Weighted Totals**:
     - $\text{Weighted Average} = \text{ആകെ ബാക്കി കാശ്} / \text{ആകെ വിറ്റ കലണ്ടർ}$ (never a simple average of averages).
5. **Stock & Cash Integrity (റീകൺസിലിയേഷൻ)**:
   - Compares **Expected Cash** ($\text{വിറ്റ കലണ്ടർ} \times \text{കലണ്ടർ വില}$) against **Actual Cash Received**.
   - Flags discrepancies, surpluses, or deficits.
   - Warnings when sold quantity exceeds taken quantity or when student exceeds target.
6. **ആകെ സംഗ്രഹം (Overall 7-Day Summary)**:
   - Unified summary with one row per day and overall totals row.
   - Guaranteed reconciliation where Day 7 cumulative net cash equals total campaign net cash.
7. **Student Management & Profiles**:
   - 40 pre-seeded students with authentic Malayalam names and individual targets.
   - Import/export via Excel/CSV.
   - Individual student profile pages with full 7-day performance logs.
8. **Reports & Exports**:
   - **Excel Export (ExcelJS)**: Separate worksheets for Data Entry and Automatic Ranking tables with styling, totals, and auto-adjusted columns.
   - **Printable / PDF Reports**: Clean layouts formatted with embedded Malayalam typography.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express, TypeScript, Zod, JWT, bcryptjs.
- **ORM & Database**: Prisma ORM with SQLite (default local zero-friction setup) and ready-to-deploy PostgreSQL / Supabase schema (`prisma.postgresql.prisma`).
- **Reporting**: ExcelJS for multi-sheet workbooks, native print engine with Malayalam Unicode support.
- **Testing**: Vitest automated calculation and integration test suite.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or v20+)
- npm

### 1. Installation

From the project root directory:

```bash
# Install root dependencies and workspaces
npm run install:all
```

Or install in each folder individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Database Setup & Seeding

The application comes pre-configured with SQLite for zero-config local operation:

```bash
cd server
npm run prisma:push
npm run seed
```

This seeds:
- 3 test users (**Admin**, **Operator**, **Viewer**)
- 1 Active Campaign (**കലണ്ടർ വിൽപന 2026 - വാർഷിക ക്യാമ്പയിൻ**)
- 40 students with Malayalam names and custom targets
- 7 days of realistic sales data

### 3. Running the Application

In development mode:

**Terminal 1 (Backend Server)**:
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 4. Running Automated Tests

Run the comprehensive 18 unit and database tests:

```bash
cd server
npm test
```

---

## 👥 Default Demo Credentials

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **അഡ്മിനിസ്ട്രേറ്റർ (Admin)** | `admin` | `admin123` | Full control, settings, user management, audit logs |
| **ഓപ്പറേറ്റർ (Operator)** | `operator` | `operator123` | Enter daily sales, stock, cash, expenses |
| **നിരീക്ഷകൻ (Viewer)** | `viewer` | `viewer123` | View dashboards, rankings, summaries, reports |

*(Clickable 1-tap demo buttons are also provided on the login screen)*

---

## 🗄️ Database Schema & Production PostgreSQL Setup

To deploy to PostgreSQL or Supabase:

1. Update `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@db.supabase.co:5432/postgres?sslmode=require"
   ```
2. Replace `server/prisma/schema.prisma` with `server/prisma/schema.postgresql.prisma`.
3. Run `npx prisma db push` or `npx prisma migrate deploy`.

---

## 📊 Verification Scenarios Covered in Automated Tests

- [x] Day 1 remaining stock equals taken minus sold.
- [x] Daily net cash equals cash received minus expenses.
- [x] Daily average equals daily net cash divided by sold calendars ($0$ if sold is $0$).
- [x] Cumulative calendars sold include all previous days.
- [x] Remaining target decreases as cumulative sales increase ($\max(0, \text{Target} - \text{Cumulative Sold})$).
- [x] Cumulative net cash includes all previous daily net cash values.
- [x] Cumulative average uses cumulative net cash divided by cumulative calendars sold.
- [x] Automatic ranking ordered by today's net cash descending.
- [x] Consistent tie-breaking with shared rank and Malayalam alphabetical secondary order.
- [x] Table A (Data Entry) and Table B (Ranking) remain visibly and functionally separate.
- [x] SUM rows remain pinned at the bottom of both tables with weighted averages.
- [x] Missing daily entries treated as zero without breaking formulas.
- [x] Zero calendars sold never causes division by zero error.
- [x] Database relationships, student preservation, and 40-student scale verified.
