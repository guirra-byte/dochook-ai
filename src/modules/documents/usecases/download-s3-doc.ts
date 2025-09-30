import type { DocumentsUploadedRequest } from "../http/documents.controller.js";
import S3Provider from "../../../core/providers/aws/s3/index.js";
import RabbitMqProvider from "../../../core/providers/rabbitmq/index.js";

export interface FullfilledDocDownload {
  filename: string;
  stream: ReadableStream<any>;
}

class DownloadS3Doc {
  async execute({
    documents,
    bucket,
    batchTag,
  }: DocumentsUploadedRequest): Promise<void> {
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

    await Promise.allSettled(downloadAll).then((results) => {
      results.map(async (result) => {
        if (result.status === "fulfilled") {
          const { filename, stream } = result.value as FullfilledDocDownload;
          await this.notify({ filename, stream });
        }
      });
    });
  }

  private async notify(content: FullfilledDocDownload) {
    const rabbitMq = await RabbitMqProvider.instance();
    const queueConfig = {
      exchange: "docs_exchange",
      name: "docs_bounding_boxes",
      rountingKey: "bounding_boxes",
    };

    await rabbitMq.assertExchange(queueConfig.exchange, "direct");
    await rabbitMq.assertQueue(queueConfig.name, { durable: true });
    await rabbitMq.bindQueue(
      queueConfig.name,
      queueConfig.exchange,
      queueConfig.rountingKey
    );

    rabbitMq.publish(
      queueConfig.exchange,
      queueConfig.rountingKey,
      Buffer.from(JSON.stringify(content))
    );
  }
}

export const downloadS3Docs = new DownloadS3Doc();
