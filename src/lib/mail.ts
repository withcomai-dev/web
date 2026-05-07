import nodemailer from "nodemailer";
import { getIntegration } from "@/lib/integrations";

let _transporter: nodemailer.Transporter | null = null;
let _user = "";
let _pass = "";

async function getTransporter(): Promise<nodemailer.Transporter> {
  const user = await getIntegration("smtpUser");
  const pass = await getIntegration("smtpAppPassword");
  if (!user || !pass) {
    throw new Error(
      "SMTP 계정·비밀번호가 설정되지 않았습니다. 어드민 → 외부 서비스 키에서 입력하세요.",
    );
  }
  if (_transporter && _user === user && _pass === pass) return _transporter;
  _user = user;
  _pass = pass;
  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return _transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  const transporter = await getTransporter();
  const fromUser = await getIntegration("smtpUser");
  const adminMail = await getIntegration("adminNotifyEmail");
  await transporter.sendMail({
    from: `"위드컴정보" <${fromUser}>`,
    to: msg.to,
    replyTo: msg.replyTo ?? adminMail ?? fromUser,
    subject: msg.subject,
    text: msg.text,
    html: msg.html ?? (msg.text ? msg.text.replace(/\n/g, "<br>") : undefined),
  });
}

export function inquiryReplyTemplate(args: {
  recipientName: string;
  inquiryMessage: string;
  reply: string;
}): { subject: string; html: string } {
  const safe = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return {
    subject: `[위드컴정보] 문의에 대한 답변입니다.`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff;color:#111">
        <h2 style="color:#2563eb;margin:0 0 16px">위드컴정보 답변</h2>
        <p>${safe(args.recipientName)} 님, 안녕하세요.</p>
        <p>문의 주신 내용에 대한 답변을 드립니다.</p>

        <div style="margin:24px 0;padding:16px;background:#f3f4f6;border-radius:8px;border-left:4px solid #9ca3af">
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px">회원님의 문의</p>
          <p style="margin:0;white-space:pre-wrap">${safe(args.inquiryMessage)}</p>
        </div>

        <div style="margin:24px 0;padding:16px;background:#eff6ff;border-radius:8px;border-left:4px solid #2563eb">
          <p style="font-size:12px;color:#1e40af;margin:0 0 8px">답변</p>
          <div class="reply-body">${args.reply}</div>
        </div>

        <p style="margin-top:32px;font-size:13px;color:#6b7280">
          추가 문의사항은 이 메일에 회신하시거나, <a href="https://withcom.runmoa.com">위드컴정보 사이트</a>를 방문해 주세요.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="font-size:11px;color:#9ca3af">© 위드컴정보 · 02-841-7241 · withcom7@naver.com</p>
      </div>`,
  };
}

export function helpAnswerTemplate(args: {
  question: string;
  answer: string;
}): { subject: string; html: string } {
  const safe = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return {
    subject: `[위드컴정보] 보내주신 질문에 대한 답변입니다.`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff;color:#111">
        <h2 style="color:#2563eb;margin:0 0 16px">위드컴정보 답변</h2>
        <p>도움말 위젯으로 보내주신 질문에 답변드립니다.</p>
        <div style="margin:16px 0;padding:16px;background:#f3f4f6;border-radius:8px">
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px">질문</p>
          <p style="margin:0;white-space:pre-wrap">${safe(args.question)}</p>
        </div>
        <div style="margin:16px 0;padding:16px;background:#eff6ff;border-radius:8px">
          <p style="font-size:12px;color:#1e40af;margin:0 0 8px">답변</p>
          <div class="answer-body">${args.answer.replace(/\n/g, "<br>")}</div>
        </div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="font-size:11px;color:#9ca3af">© 위드컴정보</p>
      </div>`,
  };
}

export function feedbackResolvedTemplate(args: {
  message: string;
  resolution?: string;
}): { subject: string; html: string } {
  const safe = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return {
    subject: `[위드컴정보] 신고하신 내용이 처리되었습니다.`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#10b981;margin:0 0 16px">처리 완료</h2>
        <p>알려주신 내용을 확인하고 처리하였습니다. 감사합니다.</p>
        <div style="margin:16px 0;padding:12px;background:#f3f4f6;border-radius:8px;font-size:13px">
          <strong>회원님의 신고</strong><br>${safe(args.message)}
        </div>
        ${args.resolution ? `<div style="margin:16px 0;padding:12px;background:#ecfdf5;border-radius:8px;font-size:13px"><strong>처리 내용</strong><br>${safe(args.resolution).replace(/\n/g, "<br>")}</div>` : ""}
      </div>`,
  };
}
