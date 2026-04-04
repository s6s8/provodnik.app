declare module "bun:test" {
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function describe(
    label: string,
    fn: () => void | Promise<void>,
  ): void;
  export function test(
    label: string,
    fn: () => void | Promise<void>,
  ): void;
  export const expect: (value: unknown) => {
    toEqual(expected: unknown): void;
    toHaveBeenCalledTimes(expected: number): void;
  };
  export const mock: {
    <T extends (...args: any[]) => any>(
      implementation: T,
    ): T & {
      mockClear(): void;
      mockResolvedValueOnce(value: unknown): void;
      mockRejectedValueOnce(error: unknown): void;
    };
    module(specifier: string, factory: () => unknown): void;
  };
}
