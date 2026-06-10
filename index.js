require("dotenv").config();

const { App } = require("@slack/bolt");
const { default: axios } = require("axios");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

app.command("/blob-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/blob-catfact", async ({ command, ack, respond }) =>{
  await ack();

  try {
      const response = await axios.get("https://catfact.ninja/fact");
      await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
      await respond({ text: "Failed to fetch a cat fact." });
  }

});

app.command("/blob-8ball", async ({ command, ack, respond }) => {
  await ack();

  const question = command.text.trim();
  if (!question) {
    await respond("Ask a question! Example: `/blob-8ball Will I pass my exam?`");
    return;
  }
  const answers = [
    "Yes.",
    "No.",
    "Maybe.",
    "Ask again later.",
    "Definitely!"
  ];
  const answer = answers[Math.floor(Math.random() * answers.length)];

  await respond(`🎱 Question: ${question}\nAnswer: ${answer}`);
});

app.command("/blob-whoami", async ({ command, ack, respond, client }) =>{
  await ack();

  const slackid = command.user_id
  const name = command.user_name
  await respond(`
Name: ${name}
SlackID: ${slackid}
  `);

})

app.command("/blob-help", async ({ command, ack, respond}) => {
  await ack();

  await respond({
    text:
    `Available Commands:
    /blob-ping - Ping and Pong
    /blob-catfact - Learn more about cats :3
    /blob-8ball - Just 8Ball
    /blob-whoami - Your name and SlackID
    
    Mention Responses:
    "@BLOB Hello/Hi" - "Hi @user! :3"
    Other mentions - "What @user?"
    `
  })
})

app.event("app_mention", async ({ event, say }) => {
  const text = event.text.toLowerCase();

  if (text.includes("hello") || text.includes("hi")) {
    await say(`Hi <@${event.user}>! :3`);
  }
  else {
    await say(`What <@${event.user}>?`);
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();