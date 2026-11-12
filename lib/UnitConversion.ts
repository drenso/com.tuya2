import type { UnitScaling } from './ScalingUtil.js';

export class Temperature {
  private constructor(private celsius: number) {}

  public static C(celsius: number): Temperature {
    return new Temperature(celsius);
  }

  public static F(fahrenheit: number): Temperature {
    const celsius = (fahrenheit - 32) / 1.8;
    return new Temperature(celsius);
  }

  public toC(): number {
    return this.celsius;
  }

  public toF(): number {
    return this.celsius * 1.8 + 32;
  }
}

export function toCelsiusConversion(startUnit: 'C' | 'F') {
  if (startUnit === 'F') {
    return (value: number | undefined): number | undefined =>
      value === undefined ? value : Temperature.F(value).toC();
  }
  return (value: number | undefined): number | undefined => value;
}

export function fromCelsiusConversion(targetUnit: 'C' | 'F') {
  if (targetUnit === 'F') {
    return (value: number | undefined): number | undefined =>
      value === undefined ? value : Temperature.C(value).toF();
  }
  return (value: number | undefined): number | undefined => value;
}

export function convertAndScaleTemperatureStep(
  values: Record<string, unknown>,
  specDefault: UnitScaling<'C' | 'F'>,
): number {
  const unit = (values.unit ?? specDefault.unit) as 'C' | 'F';

  const scale = (values.scale ?? specDefault.scale) as number;
  const scaleFactor = 10 ** scale;

  let scaledStep = values.step as number | undefined;
  if (scaledStep !== undefined && unit === 'F') {
    scaledStep = scaledStep / 1.8;
  }
  scaledStep ??= specDefault.step;
  scaledStep /= scaleFactor;

  return scaledStep;
}
