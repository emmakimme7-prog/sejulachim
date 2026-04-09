import "server-only";

function renderShell(title: string, body: string, logoUrl: string) {
  return `
    <div style="margin:0;padding:24px;background:#f7f4ef;font-family:'Noto Sans KR',Apple SD Gothic Neo,sans-serif;color:#112033;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce6f2;border-radius:28px;padding:32px;">
        <img src="${logoUrl}" alt="세줄아침" style="display:block;width:148px;height:auto;margin:0 0 16px;" />
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.12em;color:#e57c23;">세줄아침</p>
        <h1 style="margin:0 0 18px;font-size:28px;line-height:1.4;color:#112033;">${title}</h1>
        ${body}
      </div>
    </div>
  `;
}

export function renderMagicLinkEmail(input: { loginUrl: string; logoUrl: string }) {
  return renderShell(
    "로그인 링크를 보내드립니다",
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:#334155;">
        아래 버튼을 누르면 바로 로그인하실 수 있습니다. 링크는 잠시 후 만료되며 한 번만 사용할 수 있습니다.
      </p>
      <p style="margin:0 0 20px;">
        <a href="${input.loginUrl}" style="display:inline-block;background:#112033;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:16px;font-weight:700;">
          로그인하기
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
        버튼이 열리지 않으면 아래 주소를 복사해 브라우저에 붙여 넣어주세요.
      </p>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#112033;word-break:break-all;">${input.loginUrl}</p>
    `,
    input.logoUrl
  );
}

export function renderPasswordResetEmail(input: { resetUrl: string; logoUrl: string }) {
  return renderShell(
    "비밀번호 재설정 안내",
    `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:#334155;">
        비밀번호를 다시 설정하려면 아래 버튼을 눌러주세요. 링크는 잠시 후 만료되며 한 번만 사용할 수 있습니다.
      </p>
      <p style="margin:0 0 20px;">
        <a href="${input.resetUrl}" style="display:inline-block;background:#e57c23;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:16px;font-weight:700;">
          비밀번호 재설정
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#64748b;">
        요청하지 않으셨다면 이 메일은 무시하셔도 됩니다.
      </p>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:#112033;word-break:break-all;">${input.resetUrl}</p>
    `,
    input.logoUrl
  );
}
