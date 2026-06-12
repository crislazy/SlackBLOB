require("dotenv").config();

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("chat.db");

const { App } = require("@slack/bolt");
const { default: axios } = require("axios");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// Set up db
db.run(`
  CREATE TABLE IF NOT EXISTS memory (
    userId TEXT PRIMARY KEY,
    history TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS channel_welcome (
    channelId TEXT PRIMARY KEY,
    welcomeEnabled INTEGER DEFAULT 1
  )
`);

// Chat History
function getHistory(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT history FROM memory WHERE userId = ?",
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? JSON.parse(row.history) : []);
      }
    );
  });
}

function saveHistory(userId, history) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO memory (userId, history)
       VALUES (?, ?)`,
      [userId, JSON.stringify(history)],
      err => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function deleteHistory(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM memory WHERE userId = ?",
      [userId],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

//-----------------------

// Welcome Message
function getWelcomeSetting(channelId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT welcomeEnabled FROM channel_welcome WHERE channelId = ?",
      [channelId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.welcomeEnabled : 0); // default OFF
      }
    );
  });
}

function setWelcomeSetting(channelId, value) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO channel_welcome (channelId, welcomeEnabled)
       VALUES (?, ?)
       ON CONFLICT(channelId) DO UPDATE SET welcomeEnabled = ?`,
      [channelId, value, value],
      err => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
//-----------------------

// Slash commands
//-----PING-----
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

//-----8BALL-----
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

  const userId = command.user_id
  const name = command.user_name
  await respond(`
Name: ${name}
SlackID: ${userId}
  `);

})

//-----RESET-----
app.command("/blob-reset", async ({ command, ack, respond }) => {
  await ack();

  const userId = command.user_id;

  try {
    await deleteHistory(userId);
    await respond("Chat history cleared.");
  } catch (err) {
    console.error(err);
    await respond("Failed to clear history.");
  }
});

//-----TALK-----
app.command("/blob-talk", async ({ command, ack, respond }) => {
  await ack();
  const allowedChannels = process.env.ALLOWED_AI.split(",");
  const channelId = command.channel_id;
  const text = command.text.trim();
  const userId = command.user_id;
  if (!allowedChannels.includes(channelId)) {
    await respond("This channel isn't allowed to use this command.")
    return;
  }
  if (!text) {
    return respond("Usage: /blob-talk <message>");
  }
  try {
    if (text.length > 1000) {
      await respond("Please keep messages under 1000 characters.");
      return;
    }
    let history = await getHistory(userId);
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
    await saveHistory(userId, history);
    await respond(response);
  } catch(err){
    console.log(err)
    await respond("There was an error")
  }
});

//-----SETWELCOME-----
app.command("/blob-setwelcome", async ({ command, ack, respond }) => {
  await ack();
  const channelId = command.channel_id;
  const arg = command.text.trim().toLowerCase();

  if (arg !== "on" && arg !== "off") {
    return respond("Usage: /blob-welcome on|off");
  }

  const value = arg === "on" ? 1 : 0;

  await setWelcomeSetting(channelId, value);

  await respond(`Welcome messages are now *${arg.toUpperCase()}* in this channel.`);
});

//-----ABOUT-----
app.command("/blob-about", async ({ command, ack, respond }) =>{
  await ack();
  const allowedChannels = process.env.ALLOWED_AI.split(",");
  const channelList = allowedChannels
    .map(id => `<#${id}>`)
    .join(", ");
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = Math.floor(uptime % 60)
  await respond(`
---*About*---
Bot Uptime: ${hours}h ${mins}m ${secs}s
Description: BLOB is a fun bot for your channel. It includes fun commands like 8ball and catfact and usefull commands like whoami. It also features a welcome message.
Host: *Nest*
Created by: <@crislzy>
---*Available Commands*---
/blob-ping - Ping and Pong
/blob-catfact - Learn more about cats :3
/blob-8ball - Just 8Ball
/blob-whoami - Your name and SlackId
/blob-about - About this bot
/blob-setwelcome <On/Off> - Sends a welcome messgae when a new member joins your channel.(Note: DEFAULT is Off)
/blob-talk <message> - Talk to the AI bot (Max history of 50 messages)
/blob-reset - Reset your chatting history with the bot
The AI Chatbot commands only works here: ${channelList}

To thank the bot, send the following message: "Thank you @BLOB"

-----
Stardance: <https://stardance.hackclub.com/projects/13469|Link>
Github Repo: <https://github.com/crislazy/SlackBLOB|Link>
    `)
});
//-----------------------

// Mention Response
app.event("app_mention", async ({ event, say }) => {
  const text = event.text.toLowerCase()
  const user = event.user
  if (!text){
    return;
  } else if (text.includes("thank you") || text.includes("thanks")){
    await say(`No problem <@${user}>! :3`)
  }
});
//-----------------------

// Join message
app.event("member_joined_channel", async ({ event, client }) => {
  const channelId = event.channel
  const enabled = await getWelcomeSetting(channelId);

  if (!enabled) return;

  await client.chat.postMessage({
    channel: event.channel,
    text: `Welcome <@${event.user}> to <#${channelId}>!`
  });
});
//-----------------------

(async () => {
  await app.start();
  console.log("bot is running!");
})();