const WEBHOOK_NAME = 'nlafonte Live';

async function getOrCreateWebhook(channel) {
  const webhooks = await channel.fetchWebhooks();
  let webhook = webhooks.find((w) => w.name === WEBHOOK_NAME);
  if (!webhook) {
    webhook = await channel.createWebhook({ name: WEBHOOK_NAME });
  }
  return webhook;
}

module.exports = { getOrCreateWebhook, WEBHOOK_NAME };
