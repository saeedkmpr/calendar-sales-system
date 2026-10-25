import ExcelJS from 'exceljs';
import prisma from '../prisma';

export interface ImportResult {
  success: boolean;
  message: string;
  studentsCount: number;
  salesCount: number;
  daysFound: number[];
}

export class ImportService {
  /**
   * Normalize Malayalam and English names for fuzzy matching
   */
  private static normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
      .toLowerCase();
  }

  /**
   * Import data from either raw pasted text or Base64 XLSX buffer
   */
  static async importWorkbookData(
    campaignId: string,
    userId: string,
    options: { text?: string; fileBase64?: string }
  ): Promise<ImportResult> {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw new Error('ക്യാമ്പയിൻ കണ്ടെത്താനായില്ല (Campaign not found)');
    }

    if (options.fileBase64) {
      const buffer = Buffer.from(options.fileBase64, 'base64');
      return await this.importFromXlsxBuffer(campaignId, userId, buffer);
    }

    if (options.text) {
      return await this.importFromText(campaignId, userId, options.text);
    }

    throw new Error('ഫയലോ വിവരങ്ങളോ നൽകിയിട്ടില്ല (No data provided)');
  }

  /**
   * Import from ExcelJS Workbook Buffer (.xlsx)
   */
  static async importFromXlsxBuffer(
    campaignId: string,
    userId: string,
    buffer: Buffer
  ): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    let combinedText = '';
    workbook.eachSheet((worksheet) => {
      combinedText += `\n=== SHEET: ${worksheet.name} ===\n`;
      worksheet.eachRow((row) => {
        const rowVals = (row.values as any[]).slice(1).map((val) => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'object' && 'result' in val) return String(val.result);
          if (typeof val === 'object' && 'text' in val) return String(val.text);
          return String(val);
        });
        combinedText += rowVals.join(',') + '\n';
      });
    });

    return await this.importFromText(campaignId, userId, combinedText);
  }

  /**
   * Import from multi-section text or single-day CSV/TSV
   */
  static async importFromText(
    campaignId: string,
    userId: string,
    rawText: string
  ): Promise<ImportResult> {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    // Existing students in campaign
    const existingCS = await prisma.campaignStudent.findMany({
      where: { campaignId },
      include: { student: true },
    });

    const studentMap = new Map<string, any>();
    existingCS.forEach((cs) => {
      studentMap.set(this.normalizeName(cs.student.name), cs.student);
      studentMap.set(this.normalizeName(cs.student.studentCode), cs.student);
    });

    let currentSection: 'NONE' | 'STUDENTS' | 'DAY_1' | 'DAY_2' | 'DAY_3' | 'DAY_4' | 'DAY_5' | 'DAY_6' | 'DAY_7' = 'NONE';
    const studentsToUpsert: { code: string; name: string; target: number }[] = [];
    const salesToUpsert: { dayNumber: number; studentName: string; taken: number; sold: number; cash: number; exp: number; notes?: string }[] = [];
    const daysDetected = new Set<number>();

    for (const line of lines) {
      // Check section headers
      if (line.includes('കുട്ടികളുടെ പട്ടിക') || line.includes('Student List')) {
        currentSection = 'STUDENTS';
        continue;
      }
      for (let d = 1; d <= 7; d++) {
        if (
          line.includes(`ദിവസം ${d}`) ||
          line.includes(`Day ${d}`) ||
          line.includes(`SHEET: ദിവസം ${d}`) ||
          line.includes(`SHEET: Day ${d}`)
        ) {
          currentSection = `DAY_${d}` as any;
          daysDetected.add(d);
          break;
        }
      }
      if (line.includes('ഓട്ടോമാറ്റിക് റാങ്കിങ്') || line.includes('Automatic Ranking') || line.includes('ആകെ സംഗ്രഹം') || line.includes('Overall Summary')) {
        currentSection = 'NONE';
        continue;
      }

      // Parse parts (comma or tab separated)
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const p0 = parts[0]?.trim();
      const p1 = parts[1]?.trim();

      // Skip header lines
      if (
        !p0 ||
        p0 === 'ക്രമം' ||
        p0 === 'റോൾ നമ്പർ' ||
        p0 === 'കുട്ടിയുടെ പേര്' ||
        p0 === 'Sl No' ||
        p0 === 'Name' ||
        p0 === 'ആകെ' ||
        p0 === 'Total'
      ) {
        continue;
      }

      if (currentSection === 'STUDENTS') {
        // Expected: Sl No, Name, Target OR Name, Target
        let name = '';
        let target = 50;
        let code = '';

        if (!isNaN(Number(p0)) && p1 && isNaN(Number(p1))) {
          code = `S${String(p0).padStart(2, '0')}`;
          name = p1;
          target = parts[2] ? parseInt(parts[2].trim(), 10) || 50 : 50;
        } else if (isNaN(Number(p0)) && parts[1]) {
          name = p0;
          target = parseInt(parts[1].trim(), 10) || 50;
          code = `S${String(studentsToUpsert.length + 1).padStart(2, '0')}`;
        }

        if (name && name.length > 1) {
          studentsToUpsert.push({ code, name, target });
        }
      } else if (currentSection.startsWith('DAY_')) {
        const dayNumber = parseInt(currentSection.split('_')[1], 10);
        // Table columns: Name, Target, [TargetRemaining], Taken, Sold, Rem, [CumSold], Cash, Exp, ...
        // In user sheet Day 1: Name, Target, Taken, Sold, Rem, Cash, Exp, Net, Avg
        // In user sheet Days 2-7: Name, Target, TargetRem, Taken, Sold, Rem, CumSold, Cash, Exp, Net, Avg, CumNet, CumAvg
        let name = p0;
        let taken = 0;
        let sold = 0;
        let cash = 0;
        let exp = 0;
        let notes = '';

        if (dayNumber === 1) {
          taken = parts[2] ? parseFloat(parts[2].trim()) || 0 : 0;
          sold = parts[3] ? parseFloat(parts[3].trim()) || 0 : 0;
          cash = parts[5] ? parseFloat(parts[5].trim()) || 0 : 0;
          exp = parts[6] ? parseFloat(parts[6].trim()) || 0 : 0;
          notes = parts[9]?.trim() || '';
        } else {
          // Day 2-7
          taken = parts[3] ? parseFloat(parts[3].trim()) || 0 : 0;
          sold = parts[4] ? parseFloat(parts[4].trim()) || 0 : 0;
          cash = parts[7] ? parseFloat(parts[7].trim()) || 0 : 0;
          exp = parts[8] ? parseFloat(parts[8].trim()) || 0 : 0;
          notes = parts[13]?.trim() || '';
        }

        if (name && name !== 'ആകെ' && name !== 'Total') {
          salesToUpsert.push({
            dayNumber,
            studentName: name,
            taken,
            sold,
            cash,
            exp,
            notes,
          });
        }
      }
    }

    // 1. Upsert students
    let createdStudentsCount = 0;
    for (let idx = 0; idx < studentsToUpsert.length; idx++) {
      const s = studentsToUpsert[idx];
      const norm = this.normalizeName(s.name);
      let student = studentMap.get(norm);

      if (!student) {
        const code = s.code || `S${String(existingCS.length + idx + 1).padStart(2, '0')}`;
        student = await prisma.student.upsert({
          where: { studentCode: code },
          update: { name: s.name },
          create: {
            studentCode: code,
            name: s.name,
            isActive: true,
          },
        });
        studentMap.set(norm, student);
      }

      await prisma.campaignStudent.upsert({
        where: {
          campaignId_studentId: {
            campaignId,
            studentId: student.id,
          },
        },
        update: {
          targetCalendars: s.target,
          isActive: true,
        },
        create: {
          campaignId,
          studentId: student.id,
          targetCalendars: s.target,
          isActive: true,
        },
      });
      createdStudentsCount++;
    }

    // 2. Upsert Daily Sales
    let salesCount = 0;
    for (const sale of salesToUpsert) {
      const norm = this.normalizeName(sale.studentName);
      let student = studentMap.get(norm);

      if (!student) {
        // try fuzzy match
        for (const [key, val] of studentMap.entries()) {
          if (key.includes(norm) || norm.includes(key)) {
            student = val;
            break;
          }
        }
      }

      if (student) {
        await prisma.dailySale.upsert({
          where: {
            campaignId_studentId_dayNumber: {
              campaignId,
              studentId: student.id,
              dayNumber: sale.dayNumber,
            },
          },
          update: {
            calendarsTaken: sale.taken,
            calendarsSold: sale.sold,
            cashReceived: sale.cash,
            expenses: sale.exp,
            notes: sale.notes || undefined,
            enteredBy: userId,
          },
          create: {
            campaignId,
            studentId: student.id,
            dayNumber: sale.dayNumber,
            calendarsTaken: sale.taken,
            calendarsSold: sale.sold,
            cashReceived: sale.cash,
            expenses: sale.exp,
            notes: sale.notes || undefined,
            enteredBy: userId,
          },
        });
        salesCount++;
      }
    }

    return {
      success: true,
      message: `വിജയകരമായി ഇറക്കുമതി ചെയ്തു! (${createdStudentsCount} വിദ്യാർത്ഥികൾ, ${salesCount} വിൽപ്പന വിവരങ്ങൾ)`,
      studentsCount: createdStudentsCount,
      salesCount,
      daysFound: Array.from(daysDetected).sort(),
    };
  }

  /**
   * Import single day entries from CSV/TSV table text
   */
  static async importSingleDaySales(
    campaignId: string,
    dayNumber: number,
    userId: string,
    text: string
  ): Promise<{ success: boolean; count: number; message: string }> {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    const campaignStudents = await prisma.campaignStudent.findMany({
      where: { campaignId },
      include: { student: true },
    });

    const studentMap = new Map<string, string>(); // normalized name -> studentId
    campaignStudents.forEach((cs) => {
      studentMap.set(this.normalizeName(cs.student.name), cs.studentId);
      studentMap.set(this.normalizeName(cs.student.studentCode), cs.studentId);
    });

    let updatedCount = 0;

    for (const line of lines) {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const p0 = parts[0]?.trim();
      if (!p0 || p0 === 'കുട്ടിയുടെ പേര്' || p0 === 'റോൾ നമ്പർ' || p0 === 'ആകെ' || p0 === 'Total') {
        continue;
      }

      let studentId = studentMap.get(this.normalizeName(p0));
      let taken = 0;
      let sold = 0;
      let cash = 0;
      let exp = 0;

      if (!studentId && parts[1]) {
        // maybe col 0 is roll no and col 1 is name
        studentId = studentMap.get(this.normalizeName(parts[1].trim()));
        if (studentId) {
          taken = parseFloat(parts[2]?.trim()) || 0;
          sold = parseFloat(parts[3]?.trim()) || 0;
          cash = parseFloat(parts[4]?.trim()) || 0;
          exp = parseFloat(parts[5]?.trim()) || 0;
        }
      } else if (studentId) {
        // Col 0 is name
        taken = parseFloat(parts[1]?.trim()) || 0;
        sold = parseFloat(parts[2]?.trim()) || 0;
        cash = parseFloat(parts[3]?.trim()) || 0;
        exp = parseFloat(parts[4]?.trim()) || 0;
      }

      if (studentId) {
        await prisma.dailySale.upsert({
          where: {
            campaignId_studentId_dayNumber: {
              campaignId,
              studentId,
              dayNumber,
            },
          },
          update: {
            calendarsTaken: taken,
            calendarsSold: sold,
            cashReceived: cash,
            expenses: exp,
            enteredBy: userId,
          },
          create: {
            campaignId,
            studentId,
            dayNumber,
            calendarsTaken: taken,
            calendarsSold: sold,
            cashReceived: cash,
            expenses: exp,
            enteredBy: userId,
          },
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      count: updatedCount,
      message: `${updatedCount} വിദ്യാർത്ഥികളുടെ കണക്കുകൾ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു!`,
    };
  }
}
