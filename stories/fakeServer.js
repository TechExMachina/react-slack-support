import { WebClient } from "@slack/web-api";

const token = atob(
  "eG94Yi0xNTI1MjAxNzY5NDUtOTYzNDI3NjE5NjgxLWYySDkyVmhVUkJEYXdraTduZGNRdEJXaQ=="
);

const slack = new WebClient(token);

const CHANNEL_NAME = "support-client";
const CACHE_TIME_USER_IN_MS = 60000;
const CACHE_TIME_MESSAGE_IN_MS = 5000;

let usersCache = { data: null, lastUpdated: 0 };
let messagesCache = {};
let channelId = null;
slack.conversations.list().then(resultConversation => {
  const channel = resultConversation.channels.find(
    c => CHANNEL_NAME === c.name
  );
  channelId = channel?.id;
});

export const getSlackMessages = async userName => {
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

export const postSlackMessage = ({ conversationId, userName, text }) => {
  return slack.chat.postMessage({
    text,
    channel: channelId,
    username: userName,
    thread_ts: conversationId
  });
};

export const postSlackFile = ({ file, conversationId }) => {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("token", token);
    form.append("filename", "Screenshot");
    form.append("title", "Screenshot");
    form.append("filetype", "auto");
    form.append("channels", channelId);
    form.append("file", file);
    form.append("thread_ts", conversationId);

    const request = new XMLHttpRequest();
    request.open("POST", "https://slack.com/api/files.upload");
    request.send(form);
    request.onload = () => {
      if (request.status !== 200) {
        const error = new Error(
          "There was an error uploading the file. Response:",
          request.status,
          request.responseText
        );
        return reject(error);
      }

      return resolve();
    };
  });
};
