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
