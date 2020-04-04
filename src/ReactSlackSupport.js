import React, { Component } from "react";
import clsx from "clsx";

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
import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import Popper from "@material-ui/core/Popper";

const useStyle = makeStyles(stylesObject);

let timeout = null;

class ReactSlackSupport extends Component {
  constructor(args) {
    super(args);

    this.state = {
      users: [],
      messages: [],
      postMyMessage: "",
      chatbox: false,
      conversationId: null,
      loadingNewMessage: false,
      answer: {}
    };

    this.buttonRef = React.createRef();

    this.loadMessages = this.loadMessages.bind(this);
    this.postMyMessage = this.postMyMessage.bind(this);
    this.getUserImg = this.getUserImg.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
    this.openChatBox = this.openChatBox.bind(this);
    this.closeChatBox = this.closeChatBox.bind(this);
    this.displayFormattedMessage = this.displayFormattedMessage.bind(this);
  }

  componentDidMount() {
    // Attach click listener to dom to close chatbox if clicked outside
    addEventListener("click", e => {
      return this.state.chatbox ? this.closeChatBox(e) : null;
    });
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  componentWillUnmount() {
    if (timeout) clearTimeout(timeout);
  }

  displayFormattedMessage(message) {
    const { classes } = this.props;

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
            dangerouslySetInnerHTML={{ __html: message.text }}
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

  postMyMessage() {
    return this.props
      .postMessage({
        text: this.state.postMyMessage,
        userName: this.props.botName,
        conversationId: this.state.conversationId
      })
      .then(() =>
        this.setState({ postMyMessage: "", loadingNewMessage: true })
      );
  }

  generateFirstMessage() {
    this.setState({ loadingNewMessage: true });

    let text = `[LIVE SUPPORT] ${this.props.botName} ask a new question`;

    if (this.props.defaultAsk) {
      text += `\n\n${this.props.defaultAsk
        .map((Q, index) => `*${Q.question}* => ${this.state.answer[index]}\n`)
        .join("")}`;
    }

    this.props
      .postMessage({
        text,
        userName: this.props.botName
      })
      .then(() => {
        this.loadMessages();
      });
  }

  loadMessages() {
    const { refreshInterval = 5000 } = this.props;
    if (timeout) clearTimeout(timeout);

    this.props
      .getMessage(this.props.botName)
      .then(({ messages, users, conversationId }) => {
        const newMessages = [...messages];
        newMessages.shift();
        this.setState({
          messages: newMessages,
          users,
          conversationId,
          loadingNewMessage: false
        });

        timeout = setTimeout(this.loadMessages, refreshInterval);
      });
  }

  getUserImg(message) {
    const { classes } = this.props;
    const userId = message.user || message.username;

    const imageUser = this.state.users.find(user => user.id === userId)?.image;
    const imgSrc = imageUser || `https://robohash.org/${userId}?set=set3`;

    return (
      <Avatar className={classes.avatarLeft} alt="userIcon" src={imgSrc} />
    );
  }

  handleChange(e) {
    this.setState({ postMyMessage: e.target.value });
  }

  handleFileChange() {
    const fileToUpload = document.getElementById("chat__upload").files[0];

    this.setState({ fileUploadLoader: true });

    this.props
      .postFile({
        file: new Blob([fileToUpload]),
        conversationId: this.state.conversationId
      })
      .then(() => this.setState({ fileUploadLoader: false }));
  }

  openChatBox(e) {
    e.stopPropagation();
    e.persist();

    if (!this.state.chatbox) {
      if (!(this.props.defaultAsk?.length > 0)) this.generateFirstMessage();

      this.setState({ chatbox: true });

      document.getElementById("chat__input__text")?.focus();
    }
  }

  closeChatBox() {
    if (this.state.chatbox) this.setState({ chatbox: false });
  }

  scrollToBottom() {
    const chatMessages = document.getElementById(
      "widget-reactSlakChatMessages"
    );
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  chooseAnswer(index, value) {
    this.setState({ answer: { ...this.state.answer, [index]: value } }, () => {
      if (
        Object.keys(this.state.answer).length === this.props.defaultAsk.length
      ) {
        this.generateFirstMessage();
        document.getElementById("chat__input__text")?.focus();
      }
    });
  }

  displayQuestions() {
    return (this.props.defaultAsk || []).map((Q, index) => {
      return (
        <div key={index}>
          <h4>{Q.question}</h4>
          <ButtonGroup size="small" variant="contained">
            {Q.answer.map(a => (
              <Button
                color={this.state.answer[index] === a ? "primary" : undefined}
                onClick={() => this.chooseAnswer(index, a)}
                key={a}
                disabled={
                  !!this.state.answer[index] && this.state.answer[index] !== a
                }
              >
                {a}
              </Button>
            ))}
          </ButtonGroup>
          <br />
          <br />
        </div>
      );
    });
  }

  canIWriteMessage() {
    if (this.props.defaultAsk?.length > 0) {
      return (
        Object.keys(this.state.answer).length === this.props.defaultAsk.length
      );
    }

    return true;
  }

  render() {
    const {
      classes,
      disableFloating = false,
      buttonSize = "small",
      placement = "bottom"
    } = this.props;

    console.log("disableFloating:", disableFloating);

    return (
      <div>
        <div onClick={this.openChatBox}>
          <Fab
            ref={this.buttonRef}
            color={"primary"}
            size={buttonSize}
            style={
              disableFloating
                ? {}
                : { position: "fixed", zIndex: 999, bottom: 32, right: 32 }
            }
          >
            <Badge
              color="secondary"
              badgeContent={this.state.newMessageNotification}
            >
              <LiveHelpIcon />
            </Badge>
          </Fab>

          {this.state.chatbox && (
            <Popper
              open={true}
              anchorEl={
                disableFloating
                  ? this.buttonRef.current
                  : null
              }
              style={
                disableFloating
                  ? {}
                  : {
                      position: "fixed",
                      top: "auto",
                      left: "auto",
                      bottom: 128,
                      right: 32
                    }
              }
              placement={placement}
            >
              <Card
                style={{
                  maxWidth: "35vw",
                  minWidth: "300px",
                  position: "relative"
                }}
              >
                <div className={classes.header}>
                  <div>Live Support</div>

                  <Tooltip title={"Close"}>
                    <CancelIcon
                      style={{ cursor: "pointer" }}
                      onClick={this.closeChatBox}
                    />
                  </Tooltip>
                </div>

                <CardContent>
                  <div
                    className={classes.chatContainer}
                    id="widget-reactSlakChatMessages"
                  >
                    {this.displayFormattedMessage({
                      text: this.props.defaultMessage
                    })}
                    {this.displayQuestions()}
                    {this.state.messages.map(this.displayFormattedMessage)}
                  </div>
                </CardContent>

                <CardActions>
                  {this.state.fileUploadLoader && <div>Uploading</div>}
                  {!this.state.fileUploadLoader && (
                    <div className={classes.inputContainer}>
                      <div>
                        <Tooltip title={"Click here to send a file"}>
                          <div>
                            <label htmlFor="chat__upload">
                              <AttachFileIcon />
                            </label>

                            <input
                              type="file"
                              id="chat__upload"
                              style={{ display: "none" }}
                              value={this.state.postMyFile}
                              onChange={this.handleFileChange}
                              disabled={
                                !this.state.conversationId ||
                                !this.canIWriteMessage()
                              }
                            />
                          </div>
                        </Tooltip>
                      </div>

                      <div className={classes.inputContainer}>
                        <input
                          type="text"
                          disabled={!this.state.conversationId}
                          className={classes.input}
                          id="chat__input__text"
                          value={this.state.postMyMessage}
                          placeholder={
                            !this.canIWriteMessage()
                              ? "Please ask first question"
                              : this.state.loadingNewMessage
                              ? "Please wait…"
                              : "Enter your message..."
                          }
                          onKeyPress={e =>
                            e.key === "Enter" && this.postMyMessage()
                          }
                          onChange={this.handleChange}
                          autoComplete="off"
                        />

                        {this.state.loadingNewMessage && <CircularProgress />}
                      </div>
                    </div>
                  )}
                </CardActions>
              </Card>
            </Popper>
          )}
        </div>
      </div>
    );
  }
}

const Wrapper = props => {
  const classes = useStyle();

  return <ReactSlackSupport {...props} classes={classes} />;
};
export default Wrapper;
