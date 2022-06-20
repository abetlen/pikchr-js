type Pikchr = (pikchrString: string, className: string, flags: number, height: number, width: number) => string;
declare function loadPikchr(): Promise<Pikchr>
