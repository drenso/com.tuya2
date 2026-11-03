import { executeMigration } from './MigrationStore.js';
import { DEHUMIDIFIER_CAPABILITY_MAPPING } from '../../drivers/dehumidifier/DehumidifierConstants.js';
import type TuyaOAuth2DeviceDehumidifier from '../../drivers/dehumidifier/device.js';

export async function performMigrations(device: TuyaOAuth2DeviceDehumidifier): Promise<void> {
  await targetHumidityScalingMigration(device).catch(err =>
    device.error('Error while performing target humidity scaling migration:', err),
  );
}

async function targetHumidityScalingMigration(device: TuyaOAuth2DeviceDehumidifier): Promise<void> {
  await executeMigration(device, 'dehumidifier_target_humidity_scaling', async () => {
    const deviceSpecs =
      (await device.oAuth2Client
        .getSpecification(device.data.deviceId)
        .catch(e => device.log('Device specification retrieval failed', e))) ?? undefined;

    if (deviceSpecs?.status === undefined) {
      // Use spec defaults
      await device.setCapabilityOptions('target_humidity', {
        min: 0,
        max: 1,
        step: 0.01,
      });
      return;
    }

    for (const statusSpecification of deviceSpecs.status) {
      const tuyaCapability = statusSpecification.code;

      if (tuyaCapability !== 'dehumidify_set_value') {
        continue;
      }

      const values = JSON.parse(statusSpecification.values);
      const homeyCapability = DEHUMIDIFIER_CAPABILITY_MAPPING[tuyaCapability];

      const { min = 0, max = 100, step = 1, scale = 0 } = values as Record<string, number | undefined>;
      await device.setStoreValue(`${tuyaCapability}_scale`, { min, max, step, scale });

      const scaleFactor = 10 ** scale;

      await device.setCapabilityOptions(homeyCapability, {
        min: min / scaleFactor / 100,
        max: max / scaleFactor / 100,
        step: step / scaleFactor / 100,
      });

      if ([0, 1, 2, 3].includes(values.scale)) {
        await device.setSettings({
          [`${homeyCapability}_scaling`]: `${values.scale}`,
        });
      } else {
        device.error(`Unsupported ${tuyaCapability} scale:`, values.scale);
      }

      break;
    }
  });
}
