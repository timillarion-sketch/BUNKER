export function parseProxyUri(uri: string): string {
  try {
    const url = new URL(uri);
    const protocol = url.protocol.replace(':', '');

    switch (protocol) {
      case 'vless': {
        const params: Record<string, string> = {};
        url.searchParams.forEach((v, k) => { params[k] = v; });
        return JSON.stringify({
          log: { loglevel: 'warning' },
          inbounds: [{
            port: 10808,
            listen: '127.0.0.1',
            protocol: 'socks',
            settings: { auth: 'noaccount', udp: true, ip: '127.0.0.1' },
            sniffing: { enabled: true, destOverride: ['http', 'tls'] },
          }],
          outbounds: [{
            protocol: 'vless',
            settings: {
              vnext: [{
                address: url.hostname,
                port: parseInt(url.port || '443'),
                users: [{
                  id: url.username,
                  encryption: params.encryption || 'none',
                  flow: params.flow || '',
                  level: 0,
                }],
              }],
            },
            streamSettings: {
              network: (params.type as string) || 'tcp',
              security: params.security || 'none',
              tlsSettings: params.security === 'tls' ? {
                serverName: params.sni || url.hostname,
                allowInsecure: false,
                fingerprint: params.fp || 'chrome',
              } : undefined,
              realitySettings: params.security === 'reality' ? {
                serverName: params.sni || '',
                fingerprint: params.fp || 'chrome',
                publicKey: params.pbk || '',
                shortId: params.sid || '',
                spiderX: params.spx || '/',
              } : undefined,
              tcpSettings: params.type === 'tcp' ? {
                header: { type: params.headerType || 'none' },
              } : undefined,
              wsSettings: params.type === 'ws' ? {
                path: params.path || '/',
                headers: params.host ? { Host: params.host } : undefined,
              } : undefined,
              grpcSettings: params.type === 'grpc' ? {
                serviceName: params.serviceName || '',
                multiMode: params.multiMode === 'true',
              } : undefined,
            },
          }],
        }, null, 2);
      }

      case 'vmess': {
        const decoded = atob(url.pathname.replace(/^\//, ''));
        const config = JSON.parse(decoded);
        return JSON.stringify({
          log: { loglevel: 'warning' },
          inbounds: [{
            port: 10808,
            listen: '127.0.0.1',
            protocol: 'socks',
            settings: { auth: 'noaccount', udp: true, ip: '127.0.0.1' },
            sniffing: { enabled: true, destOverride: ['http', 'tls'] },
          }],
          outbounds: [{
            protocol: 'vmess',
            settings: {
              vnext: [{
                address: config.add,
                port: parseInt(config.port) || 443,
                users: [{
                  id: config.id,
                  alterId: parseInt(config.aid || '0') || 0,
                  security: config.scy || 'auto',
                  level: 0,
                }],
              }],
            },
            streamSettings: {
              network: config.net || 'tcp',
              security: config.tls === 'tls' ? 'tls' : config.tls || 'none',
              tlsSettings: config.tls ? {
                serverName: config.sni || config.add,
                allowInsecure: config.allowInsecure === 'true',
                fingerprint: config.fp || 'chrome',
              } : undefined,
              tcpSettings: config.net === 'tcp' ? {
                header: { type: config.type || 'none' },
              } : undefined,
              wsSettings: config.net === 'ws' ? {
                path: config.path || '/',
                headers: config.host ? { Host: config.host } : undefined,
              } : undefined,
              grpcSettings: config.net === 'grpc' ? {
                serviceName: config.serviceName || '',
                multiMode: config.multiMode === 'true',
              } : undefined,
            },
          }],
        }, null, 2);
      }

      case 'ss': {
        const userInfo = url.username ? atob(decodeURIComponent(url.username)) : '';
        const colonIdx = userInfo.indexOf(':');
        const method = colonIdx > -1 ? userInfo.substring(0, colonIdx) : 'aes-256-gcm';
        const password = colonIdx > -1 ? userInfo.substring(colonIdx + 1) : userInfo;
        return JSON.stringify({
          log: { loglevel: 'warning' },
          inbounds: [{
            port: 10808,
            listen: '127.0.0.1',
            protocol: 'socks',
            settings: { auth: 'noaccount', udp: true, ip: '127.0.0.1' },
            sniffing: { enabled: true, destOverride: ['http', 'tls'] },
          }],
          outbounds: [{
            protocol: 'shadowsocks',
            settings: {
              servers: [{
                address: url.hostname,
                port: parseInt(url.port || '443'),
                method,
                password,
                level: 0,
              }],
            },
          }],
        }, null, 2);
      }

      default:
        throw new Error(`Unsupported proxy protocol: ${protocol}`);
    }
  } catch (e) {
    throw new Error(`Failed to parse proxy URI: ${e instanceof Error ? e.message : 'invalid format'}`);
  }
}
