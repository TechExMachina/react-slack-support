import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import makeStyles from "@material-ui/core/styles/makeStyles";
import { Card, PopperPlacementType } from "@material-ui/core";
import CardContent from "@material-ui/core/CardContent";
import Fab from "@material-ui/core/Fab";
import Avatar from "@material-ui/core/Avatar";
import LiveHelpIcon from "@material-ui/icons/LiveHelp";
import CancelIcon from "@material-ui/icons/Cancel";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import CardActions from "@material-ui/core/CardActions";
import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import Popper from "@material-ui/core/Popper";

import stylesObject from "./style";
import { Components } from "./types/components";

// @ts-ignore
const useStyle = makeStyles(stylesObject);

let timeout: any = null;

type Question = {
  question: string;
  answer: string[];
};

type Message = {
  username: string;
  text: string;
};

type User = any;

type MessagesResult = {
  conversationId: string;
  messages: Message[];
  users: User[];
};

type Props = {
  /**
   * A uniq username to identify the connected user and keep the conversation open (with history)
   */
  botName: string;
  /**
   * An url to the user profile image
   */
  userImage: string;
  /**
   * The first message automatically displayed when the user open the modal
   */
  defaultMessage: string;
  /**
   * A function to get new messages from server. This function will be refetched every `refreshInterval` ms
   *
   * **Signature:**
   *
   * - userName : The username of user.
   *
   * **Returns:**
   * { conversationId: string, messages: Message[], users: User[] }
   */
  getMessage: (username: string) => Promise<MessagesResult>;
  /**
   * A function to post the new message to the server
   *
   * **Signature:**
   *
   * - conversationId : The conversationId return by the server on the first getMessage call.
   * - userName : The username of the user who post this message
   * - text : The content of the message
   */
  postMessage: (props: {
    conversationId: string | null;
    userName: string;
    text: string;
  }) => Promise<any>;
  /**
   * A function to upload a new file to the server
   *
   * **Signature:**
   *
   * - file : the file from input
   * - conversationId : The conversationId return by the server on the first getMessage call.
   */
  postFile: (props: {
    conversationId: string | null;
    file: any;
  }) => Promise<any>;
  /**
   * The interval between getMessage will be fetched. In milisecond
   */
  refreshInterval?: number;
  /**
   * The call button will be display inline: It will no more positionned at the bottom right if this value is true
   */
  disableFloating?: boolean;
  buttonSize?: "medium" | "large" | "small" | undefined;
  placement?: PopperPlacementType;
  defaultAsk?: Question[];
  /**
   * Override components used to display the widget
   */
  components?: Components;
};

const ReactSlackSupport = ({
  disableFloating = false,
  buttonSize = "small",
  placement = "bottom",
  defaultAsk,
  postFile,
  postMessage,
  getMessage,
  refreshInterval = 5000,
  botName,
  userImage,
  defaultMessage,
  components
}: Props) => {
  const [users, setUsers] = useState<any>([]);
  const [messages, setMessages] = useState([]);
  const [postMyMessage, setPostMyMessage] = useState("");
  const [chatbox, setChatbox] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingNewMessage, setLoadingNewMessage] = useState<boolean>(false);
  const [answer, setAnswer] = useState<Record<number, string>>({});
  const [fileUploadLoader, setFileUploadLoader] = useState<boolean>(false);

  const classes = useStyle();

  const buttonRef = useRef();

  useEffect(() => {
    // Attach click listener to dom to close chatbox if clicked outside
    addEventListener("click", e => {
      // @ts-ignore
      return chatbox ? closeChatBox(e) : null;
    });

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  useEffect(() => scrollToBottom());

  const displayFormattedMessage = (message: any) => {
    const myMessage = message.username === botName;

    return (
      <div
        key={message.ts}
        className={clsx([
          classes.chatRow,
          myMessage ? classes.chatRowRight : classes.chatRowLeft
        ])}
      >
        {!myMessage && getUserImg(message)}

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
            src={userImage}
          />
        )}
      </div>
    );
  };

  const postMyMessageFn = () => {
    return postMessage({
      text: postMyMessage,
      userName: botName,
      conversationId
    }).then(() => {
      setPostMyMessage("");
      setLoadingNewMessage(true);
    });
  };

  const generateFirstMessage = () => {
    setLoadingNewMessage(true);

    let text = `[LIVE SUPPORT] ${botName} ask a new question`;

    if (defaultAsk) {
      text += `\n\n${defaultAsk
        .map((Q, index) => `*${Q.question}* => ${answer[index]}\n`)
        .join("")}`;
    }

    postMessage({
      text,
      conversationId: null,
      userName: botName
    }).then(loadMessages);
  };

  const loadMessages = () => {
    if (timeout) clearTimeout(timeout);

    // @ts-ignore
    getMessage(botName).then(({ messages, users, conversationId }) => {
      const newMessages = [...messages];
      newMessages.shift();
      // @ts-ignore
      setMessages(newMessages);
      setUsers(users);
      setConversationId(conversationId);
      setLoadingNewMessage(false);

      timeout = setTimeout(loadMessages, refreshInterval);
    });
  };

  const getUserImg = (message: any) => {
    const userId = message.user || message.username;

    // @ts-ignore
    const imageUser = users.find(user => user.id === userId)?.image;
    const imgSrc = imageUser || `https://robohash.org/${userId}?set=set3`;

    return (
      <Avatar className={classes.avatarLeft} alt="userIcon" src={imgSrc} />
    );
  };

  const handleChange = (e: any) => setPostMyMessage(e.target.value);

  const handleFileChange = () => {
    // @ts-ignore
    const fileToUpload = document.getElementById("chat__upload").files[0];

    setFileUploadLoader(true);

    postFile({
      file: new Blob([fileToUpload]),
      conversationId
    }).then(() => setFileUploadLoader(false));
  };

  const openChatBox = (e: any) => {
    e.stopPropagation();
    e.persist();

    if (!chatbox) {
      // @ts-ignore
      if (!conversationId && !(defaultAsk?.length > 0)) generateFirstMessage();

      setChatbox(true);

      document.getElementById("chat__input__text")?.focus();
    }
  };

  const closeChatBox = () => {
    if (chatbox) setChatbox(false);
  };

  const scrollToBottom = () => {
    const chatMessages = document.getElementById(
      "widget-reactSlakChatMessages"
    );
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const chooseAnswer = (index: number, value: string) => {
    setAnswer({ ...answer, [index]: value });

    if (Object.keys(answer).length === defaultAsk?.length) {
      generateFirstMessage();
      document.getElementById("chat__input__text")?.focus();
    }
  };

  const displayQuestions = () => {
    return (defaultAsk || []).map((Q, index) => {
      return (
        <div key={index}>
          <h4>{Q.question}</h4>
          <ButtonGroup size="small" variant="contained">
            {Q.answer.map(a => {
              return (
                <Button
                  color={answer[index] === a ? "primary" : undefined}
                  onClick={() => chooseAnswer(index, a)}
                  key={a}
                  disabled={!!answer[index] && answer[index] !== a}
                >
                  {a}
                </Button>
              );
            })}
          </ButtonGroup>
          <br />
          <br />
        </div>
      );
    });
  };

  const canIWriteMessage = () => {
    if (defaultAsk && defaultAsk?.length > 0) {
      return Object.keys(answer).length === defaultAsk.length;
    }

    return true;
  };

  return (
    <div>
      <div onClick={openChatBox}>
        <div
          style={
            disableFloating
              ? {}
              : { position: "fixed", zIndex: 999, bottom: 32, right: 32 }
          }
        >
          {components?.callButton ? (
            components.callButton
          ) : (
            // @ts-ignore
            <Fab ref={buttonRef} color={"primary"} size={buttonSize}>
              <LiveHelpIcon />
            </Fab>
          )}
        </div>

        {chatbox && (
          <Popper
            open={true}
            anchorEl={disableFloating ? buttonRef.current : null}
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
                    onClick={closeChatBox}
                  />
                </Tooltip>
              </div>

              <CardContent>
                <div
                  className={classes.chatContainer}
                  id="widget-reactSlakChatMessages"
                >
                  {displayFormattedMessage({
                    text: defaultMessage
                  })}
                  {displayQuestions()}
                  {messages.map(displayFormattedMessage)}
                </div>
              </CardContent>

              <CardActions>
                {fileUploadLoader && <div>Uploading</div>}
                {!fileUploadLoader && (
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
                            onChange={handleFileChange}
                            disabled={!conversationId || !canIWriteMessage()}
                          />
                        </div>
                      </Tooltip>
                    </div>

                    <div className={classes.inputContainer}>
                      <input
                        type="text"
                        disabled={!conversationId}
                        className={classes.input}
                        id="chat__input__text"
                        value={postMyMessage}
                        placeholder={
                          !canIWriteMessage()
                            ? "Please ask first question"
                            : loadingNewMessage
                            ? "Please wait…"
                            : "Enter your message..."
                        }
                        onKeyPress={e => e.key === "Enter" && postMyMessageFn()}
                        onChange={handleChange}
                        autoComplete="off"
                      />

                      {loadingNewMessage && <CircularProgress />}
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
};
export default ReactSlackSupport;
