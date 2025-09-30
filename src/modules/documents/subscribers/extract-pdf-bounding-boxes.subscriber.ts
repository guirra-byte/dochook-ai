import type { ConsumeMessage } from "amqplib";
import RabbitMqProvider from "../../../core/providers/rabbitmq/index.js";
import type { FullfilledDocDownload } from "../usecases/download-s3-doc.js";
import { extractPdfBoundingBoxes } from "../usecases/extract-pdf-bounding-boxes.js";

export async function extractPdfBoundingBoxesSubscriber() {
  const rabbitMq = await RabbitMqProvider.instance();
  rabbitMq.consume(
    "docs_bounding_boxes",
    async (msg: ConsumeMessage | null) => {
      if (msg) {
        const { filename, stream } = JSON.parse(
          msg.content.toString("utf-8")
        ) as FullfilledDocDownload;

        await extractPdfBoundingBoxes.execute({ filename, stream });
      }
    }
  );
}

extractPdfBoundingBoxesSubscriber();
