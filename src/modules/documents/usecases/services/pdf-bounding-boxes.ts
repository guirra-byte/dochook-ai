import PdfJs, {
  type OnProgressParameters,
  type PDFDocumentProxy,
} from "pdfjs-dist";

import type { TextItem } from "pdfjs-dist/types/src/display/api.js";
import type DownloadS3Doc from "./download-s3-doc.js";
import { streamToBuffer } from "../../../../core/utils/stream-to-buffer.js";
import type { FullfilledDocDownload } from "./download-s3-doc.js";

interface S3DownloadResponse {
  filename: string;
  stream: ReadableStream;
}

enum ProgressStatus {
  PENDING = "PENDING",
  FINISHED = "FINISHED",
}

interface DocumentProgressData {
  status: ProgressStatus;
  data: PDFDocumentProxy;
  buffer: Buffer<ArrayBufferLike>;
}

interface PageBoundingBox {
  fromPage: number;
  boundingBoxes: {
    x: number;
    y: number;
    index: number;
    width: number;
    height: number;
    content: string;
  }[];
}

export default class PdfBoundingBoxes {
  constructor(private readonly downloadS3DocsService: DownloadS3Doc) {}

  async execute(downloadedDocs: FullfilledDocDownload[]) {
    const BATCH_MAX_SIZE = 10;

    downloadedDocs.map(async (doc) => {
      const { stream, filename } = doc as S3DownloadResponse;
      const docBuffer = await streamToBuffer(stream);

      const pdf = PdfJs.getDocument(docBuffer);
      const loadedPdfs = new Map<string, DocumentProgressData>();

      pdf.onProgress = async (args: OnProgressParameters) => {
        if (args.loaded === args.total) {
          if (!loadedPdfs.has(pdf.docId)) {
            const pdfData = await pdf.promise;
            loadedPdfs.set(pdf.docId, {
              status: ProgressStatus.FINISHED,
              data: pdfData,
              buffer: docBuffer,
            });
          }
        }
      };

      const docBoundingBoxes = new Map<string, PageBoundingBox[]>();
      for await (const [docId, { data, status, buffer }] of loadedPdfs) {
        if (status === ProgressStatus.FINISHED) {
          let page = 1;
          while (page < data.numPages) {
            const currentPage = await data.getPage(page);
            const currentPageContent = await currentPage.getTextContent({
              includeMarkedContent: false,
              disableNormalization: true,
            });

            currentPageContent.items.map((item, index) => {
              const textItem = item as TextItem;

              if (textItem) {
                const [_a, _b, _c, _d, x, y] = textItem.transform;
                const boundContent = {
                  x,
                  y,
                  index,
                  fromPage: page,
                  width: textItem.width,
                  height: textItem.height,
                  content: textItem.str,
                };

                if (!docBoundingBoxes.has(docId)) {
                  docBoundingBoxes.set(docId, [
                    { fromPage: page, boundingBoxes: [boundContent] },
                  ]);
                } else {
                  const prevData = docBoundingBoxes.get(docId);
                  if (prevData) {
                    const pageBound = prevData.findIndex(
                      (bound) => bound.fromPage === page
                    );

                    if (pageBound !== -1) {
                      prevData[pageBound]?.boundingBoxes.push(boundContent);
                    } else {
                      prevData.push({
                        boundingBoxes: [boundContent],
                        fromPage: page,
                      });
                    }
                  }
                }
              }
            });
          }
        }
      }
    });
  }
}

// const newDocSinglePage = await PDFDocument.create();

// const originalDoc = await PDFDocument.load(buffer);
// const [copiedPage] = await newDocSinglePage.copyPages(originalDoc, [page]);

// if (copiedPage) {
//   newDocSinglePage.addPage(copiedPage);

//   const s3Key = `${docId}/singlepage-snapshot/page-${page}.png`;
//   const docBuffer = Buffer.from(await newDocSinglePage.save());

//   const docxImage = await sharp(docBuffer).resize(600).png().toBuffer();

//   await S3Provider.upload({
//     buffer: docxImage,
//     key: s3Key,
//     contentType: S3UploadContextType.PNG,
//     bucket: "doc-pages",
//   });
// }
