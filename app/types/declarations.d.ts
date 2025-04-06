declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    [key: string]: any;
  }

  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: any;
    version: string;
  }

  function PDFParse(buffer: Buffer, options?: any): Promise<PDFData>;
  
  export = PDFParse;
} 