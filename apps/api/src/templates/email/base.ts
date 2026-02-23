export const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
    .header { text-align: center; margin-bottom: 30px; }
    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
    .button { display: inline-block; padding: 10px 20px; background-color: #14b8a6; color: #fff; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #14b8a6;">OrbisVoice</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} OrbisVoice. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
