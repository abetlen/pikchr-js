declare namespace loadPikchr {
  type Result = {
    svg: string;
    width: number;
    height: number;
  };

  type Flags = {
    PLAINTEXT_ERRORS: 0x0001;
    DARK_MODE: 0x0002;
  };

  type Pikchr = {
    (pikchrString: string, className?: string, flags?: number, height?: number, width?: number): string;
    render(pikchrString: string, className?: string, flags?: number): Result;
    flags: Flags;
  };
}

declare function loadPikchr(): Promise<loadPikchr.Pikchr>;

export = loadPikchr;
