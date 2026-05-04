import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getJWTClient() {
  const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("Google Sheets 서비스 계정이 설정되어 있지 않습니다.");
  }
  const key = rawKey.replace(/\\n/g, "\n");
  return new google.auth.JWT({ email, key, scopes: SCOPES });
}

export async function appendInquiryRow(row: {
  createdAt: string;
  type: string;
  name: string;
  company?: string;
  phone?: string;
  email: string;
  message: string;
}): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEETS_INQUIRY_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEETS_INQUIRY_SHEET_ID 가 설정되지 않았습니다.");
  }

  const auth = getJWTClient();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "문의!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          row.createdAt,
          row.type,
          row.name,
          row.company ?? "",
          row.phone ?? "",
          row.email,
          row.message,
        ],
      ],
    },
  });
}
