export default theme => {
  return {
    header: {
      backgroundColor: theme.palette?.primary?.main || "#04a6fc",
      padding: 16,
      display: "flex",
      justifyContent: "space-between"
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
      backgroundColor: "#ececec",
      borderRadius: 16,
      padding: 8
    },
    bubbleRemote: {
      backgroundColor: "#04a6fc",
      color: "#fff"
    },
    inputContainer: {
      display: "flex",
      alignItems: "center"
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
