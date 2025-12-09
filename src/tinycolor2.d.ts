declare module "tinycolor2" {
  interface TinyColor {
    isDark(): boolean;
    isLight(): boolean;
    toHex(): string;
    toRgb(): { r: number; g: number; b: number; a?: number };
    toHsl(): { h: number; s: number; l: number; a?: number };
  }

  function tinycolor(color?: string | { r: number; g: number; b: number }): TinyColor;
  export = tinycolor;
}

