import { DEVICE_CATEGORIES } from '../../lib/TuyaOAuth2Constants.js';
import TuyaOAuth2Driver, { type ListDeviceProperties } from '../../lib/TuyaOAuth2Driver.js';
import { constIncludes, getFromMap } from '../../lib/TuyaOAuth2Util.js';
import type {
  TuyaDeviceDataPointResponse,
  TuyaDeviceResponse,
  TuyaDeviceSpecificationResponse,
} from '../../types/TuyaApiTypes.js';
import type { StandardDeviceFlowArgs } from '../../types/TuyaTypes.js';
import { LIQUID_LEVEL_CAPABILITIES, LIQUID_LEVEL_CAPABILITIES_MAPPING } from './TuyaLiquidLevelConstants.js';

export default class TuyaOAuth2DriverLiquidLevel extends TuyaOAuth2Driver {
  protected TUYA_DEVICE_CATEGORIES = [DEVICE_CATEGORIES.UNDOCUMENTED.LIQUID_LEVEL] as const;

  public async onInit(): Promise<void> {
    await super.onInit();

    for (const capability of ['alarm_liquid_low', 'alarm_liquid_high']) {
      this.homey.flow
        .getConditionCard(`sensor_liquid_level_${capability}_is_true`)
        .registerRunListener((args: StandardDeviceFlowArgs) => args.device.getCapabilityValue(capability));
    }
  }

  protected onTuyaPairListDeviceProperties(
    device: TuyaDeviceResponse,
    specifications?: TuyaDeviceSpecificationResponse,
    dataPoints?: TuyaDeviceDataPointResponse,
  ): ListDeviceProperties {
    const props = super.onTuyaPairListDeviceProperties(device, specifications, dataPoints);

    for (const status of device.status) {
      const tuyaCapability = status.code;

      const homeyCapability = getFromMap(LIQUID_LEVEL_CAPABILITIES_MAPPING, tuyaCapability);
      if (homeyCapability) {
        props.store.tuya_capabilities.push(tuyaCapability);
        props.capabilities.push(homeyCapability);
      }

      if (tuyaCapability === 'liquid_state') {
        props.store.tuya_capabilities.push(tuyaCapability);
        props.capabilities.push('alarm_liquid_low', 'alarm_liquid_high');
      }

      if (
        constIncludes(LIQUID_LEVEL_CAPABILITIES.setting, tuyaCapability) ||
        constIncludes(LIQUID_LEVEL_CAPABILITIES.setting_scaled, tuyaCapability)
      ) {
        props.store.tuya_capabilities.push(tuyaCapability);
      }
    }

    if (!specifications || !specifications.status) {
      return props;
    }

    for (const specification of specifications.status) {
      const tuyaCapability = specification.code;
      if (
        !constIncludes(LIQUID_LEVEL_CAPABILITIES.read_only_scaled, tuyaCapability) &&
        !constIncludes(LIQUID_LEVEL_CAPABILITIES.setting_scaled, tuyaCapability)
      ) {
        continue;
      }

      const values = JSON.parse(specification.values);
      if ([0, 1, 2, 3].includes(values.scale)) {
        props.settings[`${tuyaCapability}_scaling`] = `${values.scale}`;
      } else {
        this.error(`Unsupported ${tuyaCapability} scale:`, values.scale);
      }
    }

    return props;
  }
}
