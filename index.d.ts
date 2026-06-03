type PikchrResult = {
  svg: string;
  width: number;
  height: number;
};
type Pikchr = {
  (pikchrString: string, className?: string, flags?: number, height?: number, width?: number): string;
  render(pikchrString: string, className?: string, flags?: number): PikchrResult;
};
declare function loadPikchr(): Promise<Pikchr>
