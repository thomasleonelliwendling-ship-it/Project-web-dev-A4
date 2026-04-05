import nodemailer from 'nodemailer'

import config from '../config.js'

function buildTransport() {
  const { host, port, user, pass } = config.mail
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }
  return nodemailer.createTransport({ jsonTransport: true })
}

const transporter = buildTransport()

// ─── Template HTML de base ───────────────────────────────────────
function baseTemplate(title, contentHtml) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#131722;border:1px solid #2a2e39;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #2a2e39;">
    <table width="100%"><tr>
      <td><span style="background:linear-gradient(135deg,#f7931a,#d4710a);color:#000;font-weight:900;font-size:14px;padding:6px 10px;border-radius:6px;">LW</span>
      <span style="color:#d1d4dc;font-size:17px;font-weight:700;margin-left:10px;vertical-align:middle;">L-W Trade</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <h2 style="color:#d1d4dc;font-size:20px;margin:0 0 16px;">${title}</h2>
    <div style="color:#787b86;font-size:14px;line-height:1.6;">${contentHtml}</div>
  </td></tr>
  <tr><td style="padding:20px 32px;border-top:1px solid #2a2e39;text-align:center;">
    <p style="color:#787b86;font-size:11px;margin:0;">L-W Trade — Plateforme de trading</p>
    <p style="color:#787b86;font-size:11px;margin:4px 0 0;">Cet email a ete envoye automatiquement, merci de ne pas y repondre.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function priceTag(price) {
  return `<span style="color:#d1d4dc;font-weight:600;">$${Number(price).toFixed(2)}</span>`
}

function greenTag(text) {
  return `<span style="color:#26a69a;font-weight:600;">${text}</span>`
}

function redTag(text) {
  return `<span style="color:#ef5350;font-weight:600;">${text}</span>`
}

function infoRow(label, value) {
  return `<tr><td style="padding:6px 0;color:#787b86;font-size:13px;">${label}</td><td style="padding:6px 0;text-align:right;color:#d1d4dc;font-size:13px;font-weight:500;">${value}</td></tr>`
}

function infoTable(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#1a1f2e;border:1px solid #2a2e39;border-radius:8px;padding:12px 16px;">${rows}</table>`
}

// ─── Email de bienvenue ──────────────────────────────────────────
export async function sendWelcomeEmail({ email, username }) {
  const html = baseTemplate('Bienvenue sur L-W Trade !', `
    <p style="color:#d1d4dc;">Bonjour <strong>${username}</strong>,</p>
    <p>Votre compte a ete cree avec succes. Vous pouvez des maintenant explorer la plateforme, suivre les marches et commencer a trader.</p>
    ${infoTable(
      infoRow('Mode Demo', greenTag('$100,000 virtuels')) +
      infoRow('Mode Live', 'Trading reel')
    )}
    <p>Nous vous souhaitons d'excellents trades.</p>
    <p style="color:#d1d4dc;margin-top:20px;">L'equipe L-W Trade</p>
  `)

  return transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Bienvenue sur L-W Trade',
    html,
    text: `Bienvenue ${username}, votre compte L-W Trade a ete cree avec succes.`,
  })
}

// ─── Email de verification ───────────────────────────────────────
export async function sendRegistrationEmail({ email, verificationUrl }) {
  const html = baseTemplate('Confirmez votre inscription', `
    <p>Confirmez votre compte en cliquant sur le lien ci-dessous :</p>
    <p style="margin:20px 0;"><a href="${verificationUrl}" style="display:inline-block;padding:12px 28px;background:#f7931a;color:#000;font-weight:600;border-radius:8px;text-decoration:none;font-size:14px;">Confirmer mon compte</a></p>
    <p style="font-size:12px;">Ou copiez ce lien : ${verificationUrl}</p>
  `)

  return transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Confirmez votre inscription - L-W Trade',
    html,
    text: `Confirmez votre compte via ce lien : ${verificationUrl}`,
  })
}

// ─── Email Stop Loss déclenché ───────────────────────────────────
export async function sendStopLossEmail({ email, username, symbol, quantity, triggerPrice, averageCost, loss }) {
  const html = baseTemplate('Stop Loss declenche', `
    <p style="color:#d1d4dc;">Bonjour <strong>${username}</strong>,</p>
    <p>Votre ${redTag('stop loss')} a ete declenche sur <strong style="color:#d1d4dc;">${symbol}</strong>. La position a ete cloturee automatiquement.</p>
    ${infoTable(
      infoRow('Actif', `<strong style="color:#d1d4dc;">${symbol}</strong>`) +
      infoRow('Quantite', quantity) +
      infoRow('Prix d\'entree', priceTag(averageCost)) +
      infoRow('Prix de declenchement', priceTag(triggerPrice)) +
      infoRow('Perte estimee', redTag(`-$${Math.abs(loss).toFixed(2)}`)) +
      infoRow('Date', new Date().toLocaleString('fr-FR'))
    )}
    <p>La vente a ete executee au prix du marche pour limiter vos pertes.</p>
    <p style="color:#d1d4dc;margin-top:20px;">L'equipe L-W Trade</p>
  `)

  return transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: `Stop Loss declenche sur ${symbol} — L-W Trade`,
    html,
    text: `Stop loss declenche sur ${symbol}. Quantite: ${quantity}. Prix: $${triggerPrice}. Perte: -$${Math.abs(loss).toFixed(2)}.`,
  })
}

// ─── Email Take Profit atteint ───────────────────────────────────
export async function sendTakeProfitEmail({ email, username, symbol, quantity, triggerPrice, averageCost, profit }) {
  const html = baseTemplate('Take Profit atteint', `
    <p style="color:#d1d4dc;">Bonjour <strong>${username}</strong>,</p>
    <p>Votre ${greenTag('take profit')} a ete atteint sur <strong style="color:#d1d4dc;">${symbol}</strong>. La position a ete cloturee automatiquement.</p>
    ${infoTable(
      infoRow('Actif', `<strong style="color:#d1d4dc;">${symbol}</strong>`) +
      infoRow('Quantite', quantity) +
      infoRow('Prix d\'entree', priceTag(averageCost)) +
      infoRow('Prix de declenchement', priceTag(triggerPrice)) +
      infoRow('Gain estime', greenTag(`+$${profit.toFixed(2)}`)) +
      infoRow('Date', new Date().toLocaleString('fr-FR'))
    )}
    <p>La vente a ete executee au prix du marche pour securiser vos gains.</p>
    <p style="color:#d1d4dc;margin-top:20px;">L'equipe L-W Trade</p>
  `)

  return transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: `Take Profit atteint sur ${symbol} — L-W Trade`,
    html,
    text: `Take profit atteint sur ${symbol}. Quantite: ${quantity}. Prix: $${triggerPrice}. Gain: +$${profit.toFixed(2)}.`,
  })
}

// ─── Email bilan quotidien ───────────────────────────────────────
export async function sendDailySummaryEmail({ email, username, totalValue, dailyPnl, dailyPnlPercent, holdings, transactions }) {
  const pnlColor = dailyPnl >= 0 ? greenTag : redTag
  const pnlSign = dailyPnl >= 0 ? '+' : ''

  let holdingsHtml = ''
  if (holdings && holdings.length > 0) {
    const rows = holdings.slice(0, 8).map(h => {
      const pnl = h.gainLoss || 0
      const tag = pnl >= 0 ? greenTag : redTag
      return infoRow(h.symbol, tag(`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`))
    }).join('')
    holdingsHtml = `<p style="color:#d1d4dc;font-weight:600;margin-top:20px;">Positions</p>${infoTable(rows)}`
  }

  let txHtml = ''
  if (transactions && transactions.length > 0) {
    const rows = transactions.slice(0, 5).map(t =>
      infoRow(
        `${t.type === 'buy' ? 'Achat' : 'Vente'} ${t.symbol}`,
        `${t.quantity} x ${priceTag(t.price)}`
      )
    ).join('')
    txHtml = `<p style="color:#d1d4dc;font-weight:600;margin-top:20px;">Transactions du jour</p>${infoTable(rows)}`
  }

  const html = baseTemplate('Votre bilan quotidien', `
    <p style="color:#d1d4dc;">Bonjour <strong>${username}</strong>,</p>
    <p>Voici le resume de votre journee de trading.</p>
    ${infoTable(
      infoRow('Valeur totale du portefeuille', priceTag(totalValue)) +
      infoRow('P&L du jour', pnlColor(`${pnlSign}$${Math.abs(dailyPnl).toFixed(2)} (${pnlSign}${dailyPnlPercent.toFixed(2)}%)`))
    )}
    ${holdingsHtml}
    ${txHtml}
    <p style="margin-top:20px;">A demain pour un nouveau bilan.</p>
    <p style="color:#d1d4dc;">L'equipe L-W Trade</p>
  `)

  return transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Votre bilan quotidien — L-W Trade',
    html,
    text: `Bilan quotidien L-W Trade. Valeur: $${totalValue.toFixed(2)}. P&L jour: ${pnlSign}$${Math.abs(dailyPnl).toFixed(2)}.`,
  })
}
