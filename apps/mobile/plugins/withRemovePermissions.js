const { withAndroidManifest } = require('@expo/config-plugins');

const TOOLS_NS = 'http://schemas.android.com/tools';

const PERMISSIONS_TO_REMOVE = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
];

const withRemovePermissions = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    manifest.$['xmlns:tools'] = TOOLS_NS;

    const usesPermissions =
      manifest['uses-permission'] || [];

    manifest['uses-permission'] = usesPermissions.filter((node) => {
      const name = node.$ && node.$['android:name'];
      return !PERMISSIONS_TO_REMOVE.includes(name);
    });

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    for (const name of PERMISSIONS_TO_REMOVE) {
      manifest['uses-permission'].push({
        $: {
          'android:name': name,
          'tools:node': 'remove',
        },
      });
    }

    console.log(
      `[withRemovePermissions] removed: ${PERMISSIONS_TO_REMOVE.join(', ')}`,
    );

    return config;
  });
};

module.exports = withRemovePermissions;