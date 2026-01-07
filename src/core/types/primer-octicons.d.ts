/** Type declarations for \@primer/octicons (package doesn't ship types). */

declare module '@primer/octicons' {
  interface OcticonHeightData {
    width: number;
    path: string;
  }

  interface OcticonData {
    name: string;
    keywords: string[];
    heights: {
      16?: OcticonHeightData;
      24?: OcticonHeightData;
    };
    symbol: string;
    toSVG(options?: {
      width?: number;
      height?: number;
      class?: string;
      'aria-label'?: string;
      'aria-hidden'?: string;
      fill?: string;
    }): string;
  }

  const octicons: Record<string, OcticonData>;
  export default octicons;
}
