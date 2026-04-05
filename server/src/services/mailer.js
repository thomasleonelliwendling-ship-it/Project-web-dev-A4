import nodemailer from 'nodemailer'

import config from '../config.js'

function buildTransport() {
  const { host, port, user, pass } = config.mail
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    })
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  })
}

const transporter = buildTransport()

export async function sendWelcomeEmail({ email, username }) {
  const info = await transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Bienvenue sur L-W Trade !',
    text: `Bonjour ${username},\n\nVotre compte L-W Trade a ete cree avec succes.\nVous pouvez maintenant vous connecter et commencer a trader.\n\nBonne chance sur les marches !\nL'equipe L-W Trade`,
    html: `
      <h2>Bienvenue sur L-W Trade !</h2>
      <p>Bonjour ${username},</p>
      <p>Votre compte a ete cree avec succes.</p>
      <p>Vous pouvez maintenant vous connecter et commencer a trader.</p>
      <br>
      <p>Bonne chance sur les marches !</p>
      <p><em>L'equipe L-W Trade</em></p>
    `,
  })
  return info
}

export async function sendRegistrationEmail({ email, verificationUrl }) {
  const info = await transporter.sendMail({
    from: config.mail.from,
    to: email,
    subject: 'Confirmez votre inscription',
    text: `Bienvenue.\n\nConfirmez votre compte via ce lien : ${verificationUrl}`,
    html: `
      <p>Bienvenue.</p>
      <p>Confirmez votre compte via ce lien :</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    `,
  })

  return info
}
