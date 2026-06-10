# SlackBLOB
## A funny little Slack bot for your channel(WIP)

### Features
- /blob-ping - Ping and Pong
- /blob-catfact - Learn more about cats :3
- /blob-8ball - Just 8Ball
- /blob-whoami - Your name and SlackID
- Responds to pings

### Installation
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
    ```

4. Run the code
    ```bash
    node index.js
    ```

### Required Packages
- @slack/bolt
- axios
- dotenv

### Note
This project is still a work in progress and may contain bugs or incomplete features.

### License
MIT