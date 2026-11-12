export type Scaling = {
  scale: number;
  min: number;
  max: number;
  step: number;
};

export type UnitScaling<Unit extends string> = Scaling & {
  unit: Unit;
};

/**
 * Extract the scaling values from a device specification values object.
 * Undefined values are replaced by the default from specDefault.
 * Scaled versions of min, max, and step are also returned for use in capabilitiesOptions.
 *
 * @param values - The raw device specification values
 * @param specDefault - The default specification values, as defined in the standard status set documentation.
 */
export function extractScaling(
  values: Record<string, unknown>,
  specDefault: Scaling,
): {
  scale: number;
  min: number;
  scaledMin: number;
  max: number;
  scaledMax: number;
  step: number;
  scaledStep: number;
} {
  const scale = (values.scale ?? specDefault.scale) as number;
  const scaleFactor = 10 ** scale;

  let min = values.min as number | undefined;
  min ??= specDefault.min;
  const scaledMin = min / scaleFactor;

  let max = values.max as number | undefined;
  max ??= specDefault.max;
  const scaledMax = max / scaleFactor;

  let step = values.step as number | undefined;
  step ??= specDefault.step;
  const scaledStep = step / scaleFactor;

  return { scale, min, scaledMin, max, scaledMax, step, scaledStep };
}

/**
 * Extract the scaling values from a device specification values object.
 * Undefined values are replaced by the default from specDefault.
 * Scaled versions of min, max, and step are also returned for use in capabilitiesOptions.
 *
 * N.B. For non-linear conversion, such as Celsius and Fahrenheit, the scaledStep will be incorrect
 *
 * @param values - The raw device specification values
 * @param specDefault - The default specification values, as defined in the standard status set documentation.
 * @param unitConversion - A function that returns, for a given unit, a function that converts to the unit used by Homey
 */
export function extractUnitScaling<Unit extends string>(
  values: Record<string, unknown>,
  specDefault: UnitScaling<Unit>,
  unitConversion: (unit: Unit) => (value: number | undefined) => number | undefined,
): {
  unit: Unit;
  scale: number;
  min: number;
  scaledMin: number;
  max: number;
  scaledMax: number;
  step: number;
  scaledStep: number;
} {
  const unit = (values.unit ?? specDefault.unit) as Unit;
  const conversion = unitConversion(unit);

  const scale = (values.scale ?? specDefault.scale) as number;
  const scaleFactor = 10 ** scale;

  let min = values.min as number | undefined;
  let scaledMin = conversion(min);
  min ??= specDefault.min;
  scaledMin ??= specDefault.min;
  scaledMin /= scaleFactor;

  let max = values.max as number | undefined;
  let scaledMax = conversion(max);
  max ??= specDefault.max;
  scaledMax ??= specDefault.max;
  scaledMax /= scaleFactor;

  let step = values.step as number | undefined;
  let scaledStep = conversion(step);
  scaledStep ??= specDefault.step;
  step ??= specDefault.step;
  scaledStep /= scaleFactor;

  return { unit, scale, min, scaledMin, max, scaledMax, step, scaledStep };
}

/**
 * @param value - value as provided by Homey
 * @param scaling - Scaling values expected by the Tuya API
 * @param [scaleFactor] - Optional override for the scale factor, e.g. calculated from a setting
 */
export function scaleAndRoundFromHomey(value: number, scaling: Scaling, scaleFactor?: number): number {
  scaleFactor ??= 10 ** scaling.scale;
  let scaledValue = value / scaleFactor;
  scaledValue *= scaling.step;
  scaledValue = Math.round(scaledValue);
  scaledValue /= scaling.step;
  scaledValue = Math.min(scaledValue, scaling.max);
  scaledValue = Math.max(scaledValue, scaling.min);
  return scaledValue;
}

/**
 * @param value - value as provided by Homey
 * @param scaling - Scaling values expected by the Tuya API
 * @param unitConversion - A function that returns, for a given unit, a function that converts from the unit used by Homey
 * @param [scaleFactor] - Optional override for the scale factor, e.g. calculated from a setting
 */
export function convertScaleAndRoundFromHomey<Unit extends string>(
  value: number,
  scaling: UnitScaling<Unit>,
  unitConversion: (unit: Unit) => (value: number | undefined) => number | undefined,
  scaleFactor?: number,
): number {
  const convertedValue = unitConversion(scaling.unit)(value)!;
  return scaleAndRoundFromHomey(convertedValue, scaling, scaleFactor);
}

/**
 * @param value - value as provided by Tuya
 * @param scaling - Scaling values expected by the Tuya API
 * @param unitConversion - A function that returns, for a given unit, a function that converts to the unit used by Homey
 * @param [scaleFactor] - Optional override for the scale factor, e.g. calculated from a setting
 */
export function convertAndScaleToHomey<Unit extends string>(
  value: number,
  scaling: UnitScaling<Unit>,
  unitConversion: (unit: Unit) => (value: number | undefined) => number | undefined,
  scaleFactor?: number,
): number {
  scaleFactor ??= 10 ** scaling.scale;
  const convertedValue = unitConversion(scaling.unit)(value)!;
  return convertedValue / scaleFactor;
}
