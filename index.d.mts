declare namespace loadPikchr {
  type PikchrResult = {
    svg: string;
    width: number;
    height: number;
  };

  type PikchrFlags = {
    PLAINTEXT_ERRORS: 0x0001;
    DARK_MODE: 0x0002;
  };

  type Pikchr = {
    (pikchrString: string, className?: string, flags?: number, height?: number, width?: number): string;
    render(pikchrString: string, className?: string, flags?: number): PikchrResult;
    flags: PikchrFlags;
  };
}

declare function loadPikchr(): Promise<loadPikchr.Pikchr>;

export type Pikchr = loadPikchr.Pikchr;
export type PikchrFlags = loadPikchr.PikchrFlags;
export type PikchrResult = loadPikchr.PikchrResult;
export { loadPikchr };
export default loadPikchr;
