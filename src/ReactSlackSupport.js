import React, { Component } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { WebClient } from "@slack/web-api";

import makeStyles from "@material-ui/core/styles/makeStyles";
import { Card } from "@material-ui/core";
import CardContent from "@material-ui/core/CardContent";
import Fab from "@material-ui/core/Fab";
import Badge from "@material-ui/core/Badge";
import Avatar from "@material-ui/core/Avatar";
import LiveHelpIcon from "@material-ui/icons/LiveHelp";
import CancelIcon from "@material-ui/icons/Cancel";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import CardActions from "@material-ui/core/CardActions";

import stylesObject from "./style.js";

const useStyle = makeStyles(stylesObject);

import { decodeHtml, postFile } from "./lib/chat-functions";

const REFRESH_TIME = 5000;

class ReactSlackSupport extends Component {
  constructor(args) {
    super(args);

    this.slack = new WebClient(atob(this.props.apiToken));

    this.state = {
      onlineUsers: [],
      channels: [],
      messages: [],
      postMyMessage: "",
      postMyFile: "",
      chatbox: false
    };

    this.chatInitiatedTs = "";
    this.activeChannel = [];
    this.activeChannelInterval = null;

    // Bind Slack Message functions
    this.loadMessages = this.loadMessages.bind(this);
    this.postMyMessage = this.postMyMessage.bind(this);
    this.getUserImg = this.getUserImg.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);

    // Bind UI Animation functions
    this.openChatBox = this.openChatBox.bind(this);
    this.closeChatBox = this.closeChatBox.bind(this);
    this.goToChatView = this.goToChatView.bind(this);

    // Utils
    this.displayFormattedMessage = this.displayFormattedMessage.bind(this);

    this.connectBot();
  }

  displayFormattedMessage(message) {
    const { classes } = this.props;
    let messageText = decodeHtml(message.text);

    const myMessage = message.username === this.props.botName;

    return (
      <div
        key={message.ts}
        className={clsx([
          classes.chatRow,
          myMessage ? classes.chatRowRight : classes.chatRowLeft
        ])}
      >
        {!myMessage && this.getUserImg(message)}

        {message.files?.length > 0 ? (
          <div>File uploaded !</div>
        ) : (
          <div
            className={clsx([
              classes.bubble,
              myMessage && classes.bubbleRemote
            ])}
            dangerouslySetInnerHTML={{ __html: messageText }}
          />
        )}

        {myMessage && (
          <Avatar
            className={classes.avatarRight}
            alt="userIcon"
            src={this.props.userImage}
          />
        )}
      </div>
    );
  }

  connectBot() {
    this.slack.users.list().then(data => {
      const onlineUsers = [];

      data.members
        .filter(u => !u.deleted)
        .forEach(
          user =>
            !user.is_bot &&
            onlineUsers.push({
              ...user,
              real_name: user.real_name || user.name,
              image: user.profile.image_48
            })
        );

      this.setState({
        onlineUsers
      });
    });

    this.slack.conversations.list().then(data => {
      this.setState(
        {
          channels: data.channels.filter(c =>
            this.props.channels.map(c => c.name).includes(c.name)
          )
        },
        () => {
          this.activeChannel = this.state.channels[0];
        }
      );
    });
  }

  postMyMessage() {
    return this.slack.chat
      .postMessage({
        text: this.state.postMyMessage,
        channel: this.activeChannel.id,
        username: this.props.botName,
        thread_ts: this.threadTS
      })
      .then(data => {
        this.setState(
          {
            postMyMessage: "",
            sendingLoader: false
          },
          () => {
            // Adjust scroll height
            setTimeout(() => {
              const chatMessages = document.getElementById(
                "widget-reactSlakChatMessages"
              );
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }, REFRESH_TIME);
          }
        );
      })
      .catch(console.error);
  }

  loadMessages(channel) {
    if (!this.chatInitiatedTs) this.chatInitiatedTs = Date.now() / 1000;

    const getMessagesFromSlack = async () => {
      const conversations = await this.slack.conversations.history({
        channel: channel.id
      });

      const myConversation = conversations.messages.find(
        m => m.username === this.props.botName
      );

      this.threadTS = myConversation.ts;

      const { messages } = await this.slack.conversations.replies({
        channel: channel.id,
        ts: myConversation.ts
      });

      if (this.props.defaultMessage)
        messages.unshift({
          text: this.props.defaultMessage,
          ts: this.chatInitiatedTs
        });

      this.setState({ messages });
    };

    getMessagesFromSlack();

    this.activeChannelInterval = setInterval(
      getMessagesFromSlack,
      REFRESH_TIME
    );
  }

  getUserImg(message) {
    const { classes } = this.props;
    const userId = message.user || message.username;

    const imageUser = this.state.onlineUsers.find(user => user.id === userId)
      ?.image;
    const imgSrc = imageUser || `https://robohash.org/${userId}?set=set3`;

    return (
      <Avatar className={classes.avatarLeft} alt="userIcon" src={imgSrc} />
    );
  }

  handleChange(e) {
    this.setState({ postMyMessage: e.target.value });
  }

  handleFileChange(e) {
    const fileToUpload = document.getElementById("chat__upload").files[0];

    const file = new Blob([fileToUpload]);

    return this.setState(
      {
        postMyFile: e.target.value,
        fileUploadLoader: true
      },
      () =>
        postFile({
          file,
          title: file.name,
          apiToken: atob(this.props.apiToken),
          channel: this.activeChannel.id,
          thread_ts: this.threadTS
        })
          .then(() =>
            this.setState({
              postMyFile: "",
              fileUploadLoader: false
            })
          )
          .catch(console.error)
    );
  }

  goToChatView(e, channel) {
    e.stopPropagation();

    if (this.state.chatbox) {
      this.activeChannel = channel;
      this.setState({ chatbox: true }, () => {
        if (this.activeChannelInterval)
          clearInterval(this.activeChannelInterval);

        document.getElementById("chat__input__text")?.focus();

        this.loadMessages(channel);
      });
    }
  }

  openChatBox(e) {
    e.stopPropagation();
    e.persist();

    if (!this.state.chatbox) {
      this.setState(
        {
          chatbox: true,
          newMessageNotification: 0
        },
        () => {
          // Look to see if an active channel was already chosen...
          if (Object.keys(this.activeChannel).length > 0)
            this.goToChatView(e, this.activeChannel);
        }
      );
    }
  }

  closeChatBox(e) {
    if (this.state.chatbox) this.setState({ chatbox: false });
  }

  componentDidMount() {
    // Attach click listener to dom to close chatbox if clicked outside
    addEventListener("click", e => {
      return this.state.chatbox ? this.closeChatBox(e) : null;
    });
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        <div onClick={this.openChatBox}>
          <Fab
            color={"primary"}
            style={{ position: "absolute", bottom: 32, right: 32 }}
          >
            <Badge
              color="secondary"
              badgeContent={this.state.newMessageNotification}
            >
              <LiveHelpIcon />
            </Badge>
          </Fab>

          {this.state.chatbox && (
            <div style={{ position: "absolute", bottom: 120, right: 32 }}>
              <Card
                style={{
                  maxWidth: "35vw",
                  minWidth: "300px",
                  position: "relative"
                }}
              >
                <div className={classes.header}>
                  <div>{this.activeChannel.name}</div>

                  <CancelIcon
                    style={{ cursor: "pointer" }}
                    onClick={this.closeChatBox}
                  />
                </div>

                <CardContent>
                  <div id="widget-reactSlakChatMessages">
                    {this.state.messages.map(this.displayFormattedMessage)}
                  </div>
                </CardContent>

                <CardActions>
                  {this.state.fileUploadLoader && <div>Uploading</div>}
                  {!this.state.fileUploadLoader && (
                    <div className={classes.inputContainer}>
                      <div>
                        <label htmlFor="chat__upload">
                          <AttachFileIcon />
                          <input
                            type="file"
                            id="chat__upload"
                            style={{ display: "none" }}
                            value={this.state.postMyFile}
                            onChange={e => this.handleFileChange(e)}
                          />
                        </label>
                      </div>

                      <input
                        type="text"
                        className={classes.input}
                        id="chat__input__text"
                        value={this.state.postMyMessage}
                        placeholder={
                          this.props.placeholderText || "Enter your message..."
                        }
                        onKeyPress={e =>
                          e.key === "Enter" ? this.postMyMessage() : null
                        }
                        onChange={e => this.handleChange(e)}
                      />
                    </div>
                  )}
                </CardActions>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// PropTypes validation
ReactSlackSupport.propTypes = {
  apiToken: PropTypes.string.isRequired,
  channels: PropTypes.array.isRequired,
  botName: PropTypes.string,
  defaultChannel: PropTypes.string,
  defaultMessage: PropTypes.string,
  userImage: PropTypes.string
};

const Wrapper = props => {
  const classes = useStyle();

  return <ReactSlackSupport {...props} classes={classes} />;
};
export default Wrapper;
