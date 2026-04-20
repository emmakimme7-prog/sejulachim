import "server-only";

import { SolapiMessageService } from "solapi";

import { getOptionalServerEnv } from "@/lib/env";

type KakaoAlimtalkInput = {
  to: string; // 수신자 휴대폰번호 (01012345678 형식)
  variables: Record<string, string>; // #{key} → value 치환용
  disableSms?: boolean; // true면 실패 시 SMS 대체 발송 안 함 (default: true — 광고성 SMS 방지)
};

type KakaoSendResult =
  | { ok: true; groupId: string | null; messageId: string | null }
  | { ok: false; reason: string; detail?: string };

let cachedService: SolapiMessageService | null = null;

function getConfig() {
  const env = getOptionalServerEnv();
  return {
    apiKey: env.SOLAPI_API_KEY,
    apiSecret: env.SOLAPI_API_SECRET,
    pfId: env.SOLAPI_PFID,
    templateId: env.SOLAPI_TEMPLATE_ID,
    senderPhone: env.SOLAPI_SENDER_PHONE
  };
}

export function hasKakaoConfig() {
  const config = getConfig();
  return Boolean(
    config.apiKey &&
      config.apiSecret &&
      config.pfId &&
      config.templateId &&
      config.senderPhone
  );
}

function getService(): SolapiMessageService {
  if (cachedService) return cachedService;
  const { apiKey, apiSecret } = getConfig();
  if (!apiKey || !apiSecret) {
    throw new Error("SOLAPI_CONFIG_MISSING");
  }
  cachedService = new SolapiMessageService(apiKey, apiSecret);
  return cachedService;
}

/**
 * 카카오 알림톡 발송 (정보성).
 * 메시지 본문은 사전 승인된 템플릿에서 가져오며, variables 로 치환값 주입.
 * disableSms=true 로 실패 시 SMS 대체 발송 차단 (광고성 SMS 의도치 않은 발송 방지).
 */
export async function sendKakaoAlimtalk(input: KakaoAlimtalkInput): Promise<KakaoSendResult> {
  if (!hasKakaoConfig()) {
    return { ok: false, reason: "SOLAPI_CONFIG_MISSING" };
  }
  const { pfId, templateId, senderPhone } = getConfig();
  if (!pfId || !templateId || !senderPhone) {
    return { ok: false, reason: "SOLAPI_CONFIG_MISSING" };
  }
  const normalizedTo = input.to.replace(/\D/g, "");
  if (!/^010\d{8}$/.test(normalizedTo)) {
    return { ok: false, reason: "INVALID_PHONE" };
  }

  try {
    const service = getService();
    const response = await service.send({
      to: normalizedTo,
      from: senderPhone,
      kakaoOptions: {
        pfId,
        templateId,
        variables: input.variables,
        disableSms: input.disableSms ?? true
      }
    });

    const group = response as { groupInfo?: { groupId?: string } } & { messageList?: Array<{ messageId?: string }> };
    return {
      ok: true,
      groupId: group.groupInfo?.groupId ?? null,
      messageId: group.messageList?.[0]?.messageId ?? null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return { ok: false, reason: "SEND_FAILED", detail: message };
  }
}
