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

  await respond(`Question: ${question}\nAnswer: ${answer}`);
});

app.command("/blob-whoami", async ({ command, ack, respond }) =>{
  await ack();

  const slackid = command.user_id
  const name = command.user_name
  await respond(`
Name: ${name}
SlackID: ${slackid}
  `);

})

app.command("/blob-about", async ({ command, ack, respond }) =>{
  await ack();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = Math.floor(uptime % 60)
  await respond(`
---*About*---
Bot Uptime: ${hours}h ${mins}m ${secs}s
Created by: <@crislzy>
Stardance: <https://stardance.hackclub.com/projects/13469|Link>
Github Repo: <https://github.com/crislazy/SlackBLOB|Link>
    `)
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
    /blob-about - Info on the bot
    
    Mention Responses: To talk with BLOB, just ping him and ask him something.(Note: The bot remembers only the last 50 messages for each member.)
    The AI chatbot feature may be removed in the future.
    `
  })
});

const memory = new Map();
app.event("app_mention", async ({ event, say }) => {
  const text = event.text
  const userId = event.user;
  try {
    if (text.length > 1000) {
      await say("Please keep messages under 1000 characters.");
      return;
    }
    let history = memory.get(userId) || [];
    history.push({
      role: "user",
      content: text
    });

    history = history.slice(-50);
    const result = await axios.post(
      "https://ai.hackclub.com/proxy/v1/chat/completions",
      {
        model: "anthropic/claude-sonnet-4.6",
        messages: [
          {
            role: "system",
            content: `
You are BLOB, a friendly Hack Club member. You are kind of a bot but mostly a member.

You are part of the Hack Club community, not an AI assistant.

Be casual, helpful, and concise.
Follow the Hack Club Code of Conduct.
Do not act like a formal AI or mention being a model.

Keep responses short and natural like a teen in Slack.
            `,
          },
          ...history
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HACKCLUB_AI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const response = result.data.choices[0].message.content;
    history.push({
      role: "assistant",
      content: response
    });
    memory.set(userId, history);
    await say(response)
  } catch(err){
    console.log(err)
    await say("There was an error")
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();