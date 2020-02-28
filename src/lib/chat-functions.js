export const postFile = ({ file, title, apiToken, channel, thread_ts }) => {
  return new Promise((resolve, reject) => {
    const options = {
      token: apiToken,
      title,
      filename: file.name,
      filetype: "auto",
      channels: channel,
      thread_ts
    };

    const form = new FormData();
    form.append("token", options.token);
    form.append("filename", options.filename);
    form.append("title", options.title);
    form.append("filetype", options.filetype);
    form.append("channels", options.channels);
    form.append("file", new Blob([file]));
    form.append("thread_ts", options.thread_ts);

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

export const decodeHtml = html => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};
