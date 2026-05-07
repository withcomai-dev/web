import { google } from "googleapis";
import { getIntegration } from "@/lib/integrations";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

async function getJWTClient() {
  const email = await getIntegration("googleSheetsServiceAccountEmail");
  const rawKey = await getIntegration("googleSheetsServiceAccountPrivateKey");
  if (!email || !rawKey) {
    throw new Error(
      "Google Sheets Service Account 정보가 설정되지 않았습니다. 어드민 → 외부 서비스 키에서 입력하세요.",
    );
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
  const sheetId = await getIntegration("googleSheetsInquiryId");
  if (!sheetId) {
    throw new Error(
      "스프레드시트 ID가 설정되지 않았습니다. 어드민 → 외부 서비스 키에서 입력하세요.",
    );
  }

  const auth = await getJWTClient();
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
