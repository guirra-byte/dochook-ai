import RabbitMqProvider from "../../../core/providers/rabbitmq/index.js";

import type { ConsumeMessage } from "amqplib";
import type { DocumentsUploadedRequest } from "../http/documents.controller.js";
import { downloadS3Docs } from "../usecases/download-s3-doc.js";

async function downloadDocumentsSubscriber() {
  const rabbitMq = await RabbitMqProvider.instance();
  rabbitMq.consume("download_new_docs", async (msg: ConsumeMessage | null) => {
    if (msg) {
      const { documents, ...contextData } = JSON.parse(
        msg.content.toString("utf-8")
      ) as DocumentsUploadedRequest;

      await downloadS3Docs.execute({
        documents,
        bucket: contextData.bucket,
        batchTag: contextData.batchTag,
      });
    }
  });
}

downloadDocumentsSubscriber();
