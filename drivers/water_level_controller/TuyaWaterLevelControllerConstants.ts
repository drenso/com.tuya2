import type { TuyaDeviceResponse } from '../../types/TuyaApiTypes.js';
import { DEVICE_CATEGORIES } from '../../lib/TuyaOAuth2Constants.js';

/**
 * Water level controllers that Tuya files under the water heater category (rs). They reuse
 * the heater codes: temp_current is the water level in %, temp_set the level at which the
 * pump is switched off ("Level Off" in the Tuya app) and switch the power of the controller.
 */
export const WATER_LEVEL_CONTROLLER_PRODUCT_IDS = [
  'emv2b2azwfusstur', // WF96L Water level controller
] as const;

export function isWaterLevelController(device: TuyaDeviceResponse): boolean {
  return (
    device.category === DEVICE_CATEGORIES.LARGE_HOME_APPLIANCES.HEATER &&
    (WATER_LEVEL_CONTROLLER_PRODUCT_IDS as readonly string[]).includes(device.product_id)
  );
}

export type HomeyWaterLevelControllerSettings = {
  level_off: '25' | '50' | '75' | '100';
};
