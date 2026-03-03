import { ScheduleNotificationPayload } from '../interfaces/notification-payload.interface';

/**
 * Email Templates
 *
 * These are HTML email templates for schedule notifications.
 * To activate email sending, configure SMTP credentials in your .env file
 * and uncomment the actual transport in notification.processor.ts.
 */

export function buildScheduleCreatedEmail(payload: ScheduleNotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = payload.scheduledAt.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  const subject = `Konfirmasi Jadwal Konsultasi – ${formattedDate}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #1a73e8; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 24px 32px; color: #333; }
    .detail-row { display: flex; margin-bottom: 12px; }
    .detail-label { font-weight: bold; width: 160px; color: #555; }
    .footer { background: #f0f0f0; text-align: center; padding: 16px; font-size: 12px; color: #999; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Konfirmasi Jadwal Konsultasi</h1>
    </div>
    <div class="body">
      <p>Yth. <strong>${payload.customerName}</strong>,</p>
      <p>Jadwal konsultasi Anda telah berhasil dibuat. Berikut adalah detailnya:</p>

      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px; color:#555; font-weight:bold; width:160px;">Dokter</td>
          <td style="padding:10px;">${payload.doctorName}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px; color:#555; font-weight:bold;">Tujuan Konsultasi</td>
          <td style="padding:10px;">${payload.objective}</td>
        </tr>
        <tr>
          <td style="padding:10px; color:#555; font-weight:bold;">Tanggal & Waktu</td>
          <td style="padding:10px;"><strong>${formattedDate}</strong></td>
        </tr>
      </table>

      <p>Harap datang 10 menit sebelum jadwal. Jika ada pertanyaan, hubungi kami.</p>
      <p>Terima kasih,<br/><strong>Tim Healthcare Scheduling</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Healthcare Scheduling System. Semua hak dilindungi.
    </div>
  </div>
</body>
</html>`;

  const text = `Yth. ${payload.customerName},\n\nJadwal konsultasi Anda telah dibuat.\nDokter: ${payload.doctorName}\nTujuan: ${payload.objective}\nWaktu: ${formattedDate}\n\nTerima kasih.`;

  return { subject, html, text };
}

export function buildScheduleDeletedEmail(payload: ScheduleNotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const formattedDate = payload.scheduledAt.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  const subject = `Pembatalan Jadwal Konsultasi – ${formattedDate}`;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #d32f2f; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 24px 32px; color: #333; }
    .footer { background: #f0f0f0; text-align: center; padding: 16px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Pembatalan Jadwal Konsultasi</h1>
    </div>
    <div class="body">
      <p>Yth. <strong>${payload.customerName}</strong>,</p>
      <p>Jadwal konsultasi Anda telah <strong>dibatalkan</strong>. Detail jadwal yang dibatalkan:</p>

      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px; color:#555; font-weight:bold; width:160px;">Dokter</td>
          <td style="padding:10px;">${payload.doctorName}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px; color:#555; font-weight:bold;">Tujuan Konsultasi</td>
          <td style="padding:10px;">${payload.objective}</td>
        </tr>
        <tr>
          <td style="padding:10px; color:#555; font-weight:bold;">Tanggal & Waktu</td>
          <td style="padding:10px;"><strong>${formattedDate}</strong></td>
        </tr>
      </table>

      <p>Silakan hubungi kami untuk menjadwal ulang konsultasi Anda.</p>
      <p>Terima kasih,<br/><strong>Tim Healthcare Scheduling</strong></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Healthcare Scheduling System. Semua hak dilindungi.
    </div>
  </div>
</body>
</html>`;

  const text = `Yth. ${payload.customerName},\n\nJadwal konsultasi Anda telah DIBATALKAN.\nDokter: ${payload.doctorName}\nTujuan: ${payload.objective}\nWaktu: ${formattedDate}\n\nHubungi kami untuk menjadwal ulang.\n\nTerima kasih.`;

  return { subject, html, text };
}
