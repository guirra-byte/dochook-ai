import type { DocumentsUploadedRequest } from "../../http/documents.controller.js";
import S3Provider from "../../../../core/providers/aws/s3/index.js";

export default class DownloadS3Docs {
  async execute({
    documents,
    bucket,
    batchTag,
  }: DocumentsUploadedRequest): Promise<Promise<unknown>[]> {
    const downloadAll = Iterator.from(documents)
      .map((doc) => {
        return new Promise(async (resolve, reject) => {
          try {
            const fileStream = await S3Provider.download({
              bucket: bucket,
              key: doc.key,
            });

            if (!fileStream) {
              throw new Error("File should be defined...");
            }

            resolve({ filename: doc.filename, stream: fileStream });
          } catch (error) {
            reject(error);
          }
        });
      })
      .toArray();

    return downloadAll;
  }
}
