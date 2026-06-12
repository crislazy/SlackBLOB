# SlackBLOB
## A funny little Slack bot for your channel

![Hackatime](https://hackatime.hackclub.com/api/v1/badge/U09TNMQ9MCZ/crislazy/SlackBLOB)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18-blue)

## Features
### Fun
- /blob-ping - Ping and Pong
- /blob-catfact - Learn more about cats :3
- /blob-8ball - Just 8Ball
### Utility
- /blob-whoami - Your name and SlackID
- /blob-about - Info on the bot
- /blob-setwelcome On/Off - Sends a welcome messgae when a new member joins your channel.(Note: DEFAULT is Off)
### AI Chatbot
- /blob-talk message - Talk with the bot(Maximum history of messages of 50 messages)
- /blob-reset - Reset your chatting history with the bot
- To thank the bot, send the following message: "Thank you @BLOB"

## Installation
1. Clone the repo
   ```bash
   git clone https://github.com/crislazy/slackblob && cd slackblob
   ```
2. Install dependencies

   ```bash
   npm install
   ```

3. Create a *.env* file
    ```bash
    SLACK_BOT_TOKEN=xoxb-your-token
    SLACK_APP_TOKEN=xapp-your-token
    HACKCLUB_AI_KEY=your-hackclub-ai-api-key
    ```

4. Run the code
    ```bash
    node index.js
    ```

### Required Packages
- @slack/bolt
- axios
- dotenv
- sqlite3

> Note: This project is still a work in progress and may contain bugs or incomplete features.

### License
MIT