import rabbitmq, { type Channel } from "amqplib";
export default class RabbitMqProvider {
  private static amqp: Channel;
  static async instance() {
    if (!this.amqp) {
      const connection = await rabbitmq.connect("http://localhost:5672");
      this.amqp = await connection.createChannel();
    }

    return this.amqp;
  }
}
