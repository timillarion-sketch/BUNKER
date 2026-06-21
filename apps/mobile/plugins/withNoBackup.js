const {
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">176.12.72.246</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`;

const withNoBackup = (config) => {
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    mainApplication.$['android:allowBackup'] = 'false';
    mainApplication.$['android:fullBackupContent'] = 'false';
    mainApplication.$['android:networkSecurityConfig'] =
      '@xml/network_security_config';

    console.log(
      '[withNoBackup] allowBackup=false, networkSecurityConfig applied',
    );

    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      const destPath = path.join(xmlDir, 'network_security_config.xml');

      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      if (!fs.existsSync(destPath)) {
        fs.writeFileSync(destPath, NETWORK_SECURITY_CONFIG, 'utf-8');
        console.log('[withNoBackup] network_security_config.xml written');
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withNoBackup;
