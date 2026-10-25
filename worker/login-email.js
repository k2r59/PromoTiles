// Inline styles and tables keep the message readable in Gmail, Apple Mail and Outlook.
// The code is plain text: it remains selectable and visible when images are disabled.
export function loginEmail(code){
 if(!/^\d{6}$/.test(code))throw new Error('Invalid email code')
 return {
  subject:'Votre code de connexion promoTiles',
  text:`Votre scène vous attend.\n\nVotre code de connexion promoTiles : ${code}\n\nSaisissez-le dans la fenêtre de connexion du jeu. Il expire dans 10 minutes et ne peut être utilisé qu’une fois.\n\nVous n’avez pas demandé ce code ? Ignorez cet e-mail. Ne partagez jamais votre code.\n\npromoTiles · Le challenge de Noël de l’équipe Promo.dev`,
  html:`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Votre code promoTiles</title></head>
<body style="margin:0;padding:0;background-color:#061222;color:#f9f1e3;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">Votre accès au challenge de Noël. Un code, et la scène est à vous.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#061222" style="background-color:#061222;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;font-family:Arial,Helvetica,sans-serif;">
<tr><td align="center" style="padding:0 20px 24px;"><span style="font-size:28px;font-weight:bold;letter-spacing:-1px;color:#f8e5bd;">promoTiles</span><br><span style="display:inline-block;margin-top:10px;font-size:10px;letter-spacing:3px;color:#b5c8dc;">LE CHALLENGE DE NOËL</span></td></tr>
<tr><td bgcolor="#102338" style="background-color:#102338;border:1px solid #796a4f;border-radius:24px;padding:30px 24px;text-align:center;">
<img src="https://noel.promo.dev/icons/promotiles-180.png" width="96" height="96" alt="Sapin piano de Noël" style="display:block;margin:0 auto 24px;border:0;border-radius:22px;color:#f1d398;font-size:12px;">
<p style="margin:0 0 12px;font-size:10px;line-height:18px;letter-spacing:2px;color:#edcf95;">QUELQUES NOTES DE MAGIE</p>
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.12;font-weight:normal;color:#fff5e4;">La scène<br>vous <em style="color:#f1d398;">attend.</em></h1>
<p style="margin:0 0 26px;font-size:14px;line-height:23px;color:#c4d2e1;">Retrouvez votre équipe et faites résonner Noël.<br>Saisissez ce code dans le jeu pour entrer en scène.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f2d59d" style="padding:20px 8px;border-radius:16px;text-align:center;background-color:#f2d59d;color:#102238;">
<p style="margin:0 0 10px;font-size:10px;line-height:16px;font-weight:bold;letter-spacing:2px;color:#344459;">VOTRE CODE DE CONNEXION</p>
<p style="margin:0;font-family:'Courier New',monospace;font-size:36px;line-height:44px;font-weight:bold;letter-spacing:5px;color:#071426;">${code}</p>
</td></tr></table>
<p style="margin:17px 0 0;font-size:12px;line-height:20px;color:#d3c2a2;">Valable <strong>10 minutes</strong> · À usage unique</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr><td style="border-top:1px solid #355067;padding-top:20px;font-size:12px;line-height:20px;color:#aebfd2;">Vous n’avez pas demandé ce code ?<br>Ignorez simplement cet e-mail. Ne partagez jamais votre code.</td></tr></table>
</td></tr><tr><td align="center" style="padding:24px 16px 4px;font-size:11px;line-height:20px;color:#9bafc4;">Un morceau. Quelques notes. Toute l’équipe.<br><span style="color:#d3bc8d;">promoTiles · Promo.dev</span></td></tr>
</table></td></tr></table></body></html>`
 }
}
