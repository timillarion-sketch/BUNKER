export interface IpCheckResult {
  ip: string;
  country?: string;
  org?: string;
}

export async function getPublicIp(
  options?: {
    proxyHost?: string;
    proxyPort?: number;
    timeoutMs?: number;
  }
): Promise<IpCheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options?.timeoutMs ?? 5000
  );

  try {
    const response = await fetch(
      'https://ip-api.com/json/?fields=query,country,org',
      { signal: controller.signal }
    );
    const data = await response.json();
    return {
      ip: data.query ?? 'unknown',
      country: data.country,
      org: data.org,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkDnsLeak(
  expectedIpPrefix?: string
): Promise<{
  hasLeak: boolean;
  currentIp: string;
  message: string;
}> {
  try {
    const result = await getPublicIp({ timeoutMs: 8000 });

    if (expectedIpPrefix && result.ip.startsWith(expectedIpPrefix)) {
      return {
        hasLeak: false,
        currentIp: result.ip,
        message: `Трафик идёт через туннель: ${result.ip}`,
      };
    }

    return {
      hasLeak: false,
      currentIp: result.ip,
      message: `Текущий IP: ${result.ip} (${result.country ?? '?'})`,
    };
  } catch {
    return {
      hasLeak: false,
      currentIp: 'unknown',
      message: 'Не удалось проверить IP',
    };
  }
}
