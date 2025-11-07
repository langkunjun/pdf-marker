declare module 'pdfjs-dist/build/pdf' {
  export const GlobalWorkerOptions: { workerSrc: any };
  export function getDocument(src: any): { promise: Promise<any> };
}

declare module 'pdfjs-dist/build/pdf.worker.js' {
  const workerSrc: string;
  export default workerSrc;
}

