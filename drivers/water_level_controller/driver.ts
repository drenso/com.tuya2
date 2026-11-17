import TuyaOAuth2Driver, { type ListDeviceProperties } from '../../lib/TuyaOAuth2Driver.js';
import type {
  TuyaDeviceDataPointResponse,
  TuyaDeviceResponse,
  TuyaDeviceSpecificationResponse,
} from '../../types/TuyaApiTypes.js';
import { isWaterLevelController } from './TuyaWaterLevelControllerConstants.js';

export default class TuyaOAuth2DriverWaterLevelController extends TuyaOAuth2Driver {
  // Tuya files these controllers under the water heater category, so they are picked by product
  protected onTuyaPairListDeviceFilter(device: TuyaDeviceResponse): boolean {
    return isWaterLevelController(device);
  }

  protected onTuyaPairListDeviceProperties(
    device: TuyaDeviceResponse,
    specifications?: TuyaDeviceSpecificationResponse,
    dataPoints?: TuyaDeviceDataPointResponse,
  ): ListDeviceProperties {
    const props = super.onTuyaPairListDeviceProperties(device, specifications, dataPoints);

    for (const status of device.status) {
      const tuyaCapability = status.code;

      if (tuyaCapability === 'switch') {
        props.store.tuya_capabilities.push(tuyaCapability);
        props.capabilities.push('onoff');
      }

      if (tuyaCapability === 'temp_current') {
        props.store.tuya_capabilities.push(tuyaCapability);
        props.capabilities.push('measure_liquid_level');
      }

      if (tuyaCapability === 'temp_set') {
        props.store.tuya_capabilities.push(tuyaCapability);
      }
    }

    return props;
  }
}
