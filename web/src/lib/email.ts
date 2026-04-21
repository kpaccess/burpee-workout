const disclaimer = `
  <p style="margin-top:24px;padding:16px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#555;">
    <strong>⚠️ Important:</strong> I am not a coach or medical professional. Please consult your doctor before beginning any exercise program. Always start from the very beginning, progress gradually day by day, and only do the burpees you are capable of — strive for a little more each day. It is perfectly fine to stay at one level and get fit there; advancing through levels is never required.
  </p>
`;

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #0f0f0f;
  color: #f0f0f0;
`;

const headingStyle = `color: #ff3366; font-size: 24px; font-weight: 800; margin-bottom: 8px;`;
const bodyStyle = `color: #cccccc; font-size: 15px; line-height: 1.7; margin: 12px 0;`;
const highlightStyle = `color: #ffffff; font-weight: 600;`;

export function allowlistWelcomeEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;">
  <div style="${baseStyle}">
    <h1 style="${headingStyle}">🎉 You're In — Welcome to BurpeePacer!</h1>
    <p style="${bodyStyle}">
      You have been given <span style="${highlightStyle}">special access</span> to BurpeePacer. We are thrilled to have you as part of this journey.
    </p>
    <p style="${bodyStyle}">
      This is a journey toward getting healthy by devoting just <span style="${highlightStyle}">20 minutes a day</span> to yourself — time that benefits you now and in the future. You deserve that time.
    </p>
    <p style="${bodyStyle}">
      There are different levels in the program, but <span style="${highlightStyle}">it is never necessary to progress to the next level</span>. You can stay at any level as long as you like and still get incredibly fit. The goal is consistency, not competition.
    </p>
    <p style="${bodyStyle}">
      Do what you can each day. If you can only do a few burpees, that is perfectly fine — <span style="${highlightStyle}">strive for a little more each day</span>, and the results will follow.
    </p>
    ${disclaimer}
    <p style="color:#666;font-size:12px;margin-top:32px;">
      BurpeePacer · <a href="https://www.burpeepacers.com" style="color:#ff3366;">burpeepacers.com</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function signupWelcomeEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;">
  <div style="${baseStyle}">
    <h1 style="${headingStyle}">💪 Thank You for Signing Up!</h1>
    <p style="${bodyStyle}">
      Welcome to BurpeePacer! We are so glad you are here.
    </p>
    <p style="${bodyStyle}">
      This is a journey toward getting healthy by devoting just <span style="${highlightStyle}">20 minutes a day</span> to yourself — time that benefits you now and in the future. You deserve that time.
    </p>
    <p style="${bodyStyle}">
      There are different levels in the program, but <span style="${highlightStyle}">it is never necessary to progress to the next level</span>. You can stay at any level as long as you like and still get incredibly fit. The goal is consistency, not competition.
    </p>
    <p style="${bodyStyle}">
      Do what you can each day. If you can only do a few burpees, that is perfectly fine — <span style="${highlightStyle}">strive for a little more each day</span>, and the results will follow.
    </p>
    ${disclaimer}
    <p style="color:#666;font-size:12px;margin-top:32px;">
      BurpeePacer · <a href="https://www.burpeepacers.com" style="color:#ff3366;">burpeepacers.com</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}
