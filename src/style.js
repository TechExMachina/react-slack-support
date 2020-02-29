export default theme => {
  return {
    header: {
      backgroundColor: theme.palette?.primary?.main || "#04a6fc",
      color: "white",
      padding: 16,
      display: "flex",
      justifyContent: "space-between"
    },
    chatContainer: {
      maxHeight: "50vh",
      overflowY: "auto"
    },
    chatRow: {
      display: "flex",
      width: "100%",
      marginBottom: 8
    },
    chatRowLeft: {
      justifyContent: "flex-start"
    },
    chatRowRight: {
      justifyContent: "flex-end"
    },
    avatarLeft: {
      marginRight: 8
    },
    avatarRight: {
      marginLeft: 8
    },
    bubble: {
      width: "fit-content",
      maxWidth: "calc(100% - 64px)",
      backgroundColor: "#ececec",
      borderRadius: 16,
      padding: 8,
      overflowWrap: "break-word"
    },
    bubbleRemote: {
      backgroundColor: "#04a6fc",
      color: "#fff"
    },
    inputContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%"
    },
    input: {
      backgroundImage: "none",
      backgroundColor: "transparent",
      boxShadow: 0,
      width: "100%",
      border: 0,
      outline: 0
    }
  };
};
