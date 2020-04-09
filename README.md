[![npm package](https://img.shields.io/npm/v/react-slack-support/latest.svg)](https://www.npmjs.com/package/react-slack-support)
[![NPM Downloads](https://img.shields.io/npm/dm/react-slack-support.svg?style=flat)](https://npmcharts.com/compare/react-slack-support?minimal=true)
![Code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)

# react-slack-support

> react-slack-support add a beautiful widget to provide support to your visitors or customers.
>
> This package is only compatible with Material-ui > 4.0

|                                                                                                                                                 |                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| <img src="https://raw.githubusercontent.com/techexmachina/react-slack-support/master/react-slack-support-demo.png" alt="alt text" width="100%"> | <img src="https://raw.githubusercontent.com/techexmachina/react-slack-support/master/react-slack-support-demo2.png" alt="alt text" width="100%"> |

## Demonstration and Documentation

For examples in action and full documentation, go to [StoryBook](https://react-slack-support.netlify.com/)

OR

To run that demo on your own computer, clone this repository and :

```bash
$ yarn install
$ yarn storybook
```

## Getting started

### Installation

```bash
$ npm i --save react-slack-support

or

$ yarn add react-slack-support
```

### Usage

> NOTE:
> Your Slack Webhook URL should _**never**_ be available on the front end.
> For this reason you must have a server which sends the request to slack.
> This component will use getMessage, postMessage, and postFile to send to Slack but it won't send the request for you.

#### Client side

```javascript
const Helper = () => {
  const getSlackMessages = async (userName) => {
    // call your server to get fresh messages
  };
  const postSlackMessage = async ({ conversationId, userName, text }) => {
    // call your server to send new message
  };
  const postSlackFile = async ({ file, conversationId }) => {
    // call your server to send new file
  };

  return (
    <ReactSlackSupport
      botName={`Tester`}
      userImage={
        "http://www.iconshock.com/img_vista/FLAT/mail/jpg/robot_icon.jpg"
      }
      defaultMessage={"Hi ! How can i help you ?"}
      getMessage={getSlackMessages}
      postMessage={postSlackMessage}
      postFile={postSlackFile}
    />
  );
};
```

#### Sever side

Use your favorite router to expose theses functions (examples). You can do more stuff (or event connect to another provider like Microsoft Teams)

```javascript
import { WebClient } from "@slack/web-api";
import FormData from "form-data";
import atob from 'atob';
const token = atob("YOUR_SLACK_TOKEN");
const slack = new WebClient(token);
const CHANNEL_NAME = "support-client";
const CACHE_TIME_USER_IN_MS = 60000;
const CACHE_TIME_MESSAGE_IN_MS = 5000;

let usersCache = { data: null, lastUpdated: 0 };
const messagesCache = {};
let channelId = null;
slack.conversations.list().then(resultConversation => {
  const channel = resultConversation.channels.find(
    c => CHANNEL_NAME === c.name
  );
  channelId = channel?.id;
});

const postMessage = async function({ conversationId, userName, text }) {
  return slack.chat.postMessage({
    text,
    channel: channelId,
    username: userName,
    thread_ts: conversationId
  });
};

const getMessages = async function(userName) {
  if (
    !usersCache.lastUpdated ||
    Date.now() > usersCache.lastUpdated + CACHE_TIME_USER_IN_MS
  ) {
    const resultUsers = await slack.users.list();
    usersCache = {
      data: resultUsers.members,
      lastUpdated: Date.now()
    };
  }

  if (
    !messagesCache[userName]?.lastUpdated ||
    Date.now() > messagesCache[userName].lastUpdated + CACHE_TIME_MESSAGE_IN_MS
  ) {
    const conversations = await slack.conversations.history({
      channel: channelId
    });

    const myConversation = conversations.messages.find(
      m => m.username === userName
    );

    let messages = [];
    if (myConversation?.ts) {
      const results = await slack.conversations.replies({
        channel: channelId,
        ts: myConversation.ts
      });

      messages = results.messages;
    }

    messagesCache[userName] = {
      data: messages,
      lastUpdated: Date.now(),
      conversationId: myConversation?.ts || null
    };
  }

  return {
    conversationId: messagesCache[userName].conversationId,
    messages: messagesCache[userName].data,
    users: usersCache.data.map(m => ({ ...m, image: m.profile.image_32 }))
  };
};

const postFile = async function({ file, conversationId }) {
  const form = new FormData();

  const filename = "Screenshot.png";
  form.append("token", token);
  form.append("filename", filename);
  form.append("title", "Screenshot");
  form.append("filetype", "auto");
  form.append("channels", channelId);
  form.append("file", Buffer.from(file, "base64"), { filename });
  form.append("thread_ts", conversationId);

  form.submit("https://slack.com/api/files.upload", (err, res) => {
    if (err) throw err;
    res.resume();
  });
};
```

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/techexmachina/react-slack-support/graphs/contributors">

[//]: contributor-faces

<a href="https://github.com/Sylchauf"><img src="https://avatars2.githubusercontent.com/u/5569487?v=4" title="Sylchauf" width="80" height="80"></a>
<a href="https://github.com/apps/dependabot"><img src="https://avatars0.githubusercontent.com/in/29110?v=4" title="dependabot[bot]" width="80" height="80"></a>

[//]: contributor-faces

### Financial Contributors

<a href="https://github.com/techexmachina"><img src="https://avatars3.githubusercontent.com/u/36532333?v=4" title="Tech Ex Machina" width="80" height="80"></a>

## License

This project is licensed under the terms of the [MIT license](/LICENSE).
