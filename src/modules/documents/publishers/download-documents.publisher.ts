import RabbitMqProvider from "../../../core/providers/rabbitmq/index.js";
import type { DocumentsUploadedRequest } from "../http/documents.controller.js";


export default class DownloadDocumentsService {
  async execute(data: DocumentsUploadedRequest) {
    const rabbitMq = await RabbitMqProvider.instance();
    const queueConfig = {
      exchange: "docs_exchange",
      name: "download_docs",
      rountingKey: "new_docs",
    };

    await rabbitMq.assertExchange(queueConfig.exchange, "direct");
    await rabbitMq.assertQueue(queueConfig.name, { durable: true });
    await rabbitMq.bindQueue(
      queueConfig.name,
      queueConfig.exchange,
      queueConfig.rountingKey
    );

    const contextData = { batchTag: data.batchTag, bucket: data.bucket };
    const preparedData = Iterator.from(data.documents)
      .map((document) =>
        JSON.stringify({
          document,
        })
      )
      .toArray();

    rabbitMq.publish(
      queueConfig.exchange,
      queueConfig.rountingKey,
      Buffer.from(JSON.stringify({ ...contextData, documents: preparedData }))
    );
  }
}
