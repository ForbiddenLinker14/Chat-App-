document.addEventListener("DOMContentLoaded", async () => {
  const socket = io.connect();
  const messageInput = document.getElementById("message-input");
  const sendMessageButton = document.querySelector(".send-message-button");
  const conversationBoard = document.getElementById("conversation-board");
  const userJoinedContainer = document.getElementById("user-joined-container");
  const contElement = document.querySelector(".cont");
  const join = document.createElement("div");

  const imageInput = document.getElementById("imageInput");
  const imageButton = document.getElementById("imageButton");

  let avatarImage = "";

  imageButton.addEventListener("click", () => {
    imageInput.click();
  });

  imageInput.addEventListener("change", (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const imageURL = URL.createObjectURL(selectedFile);
      avatarImage = imageURL;
      console.log("avatarImage:", avatarImage);

      // Call the function to update the avatarImage in the database
      updateAvatarImageInDatabase(avatarImage);
    }
  });

  function updateAvatarImageInDatabase(imageURL) {
    // Send imageURL to your backend API for updating the database
    // You'll need to make an AJAX request or use a frontend framework like Axios
    // Example using Fetch API:
    fetch("/updateAvatarImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageURL }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Database updated:", data);
      })
      .catch((error) => {
        console.error("Error updating database:", error);
      });
  }

  let username = "";

  try {
    const nameResponse = await fetch("/getLoggedInUserName");
    if (nameResponse.ok) {
      const nameData = await nameResponse.json();
      username = nameData.name; // Update the username with the fetched name
      console.log("Logged-in user's name:", username);
      await retrieveAndDisplaySavedMessages();
    } else {
      throw new Error("Failed to fetch username");
    }

    let shouldShowCont = false;

    // Emit a 'userJoined' event with the entered username
    socket.emit("userJoined", username);

    sendMessageButton.addEventListener("click", () => {
      const message = messageInput.value.trim();
      if (message !== "") {
        sendMessage({ text: message, username: username });
        sendingMessage({ text: message, username: username });
        messageInput.value = "";
      }
    });

    socket.on("showCont", () => {
      shouldShowCont = true;
      // contElement.style.display = "flex";
    });

    socket.on("message", (data) => {
      receiveMessage(data);
      saveReceivedMessage(data);
    });

    socket.on("userJoined", (newUser) => {
      showUserJoined(newUser);
    });

    function sendMessage(message) {
      socket.emit("message", message);

      fetch("/saveMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          message: message.text,
        }),
      }).catch((error) => {
        console.error("Error saving message:", error);
      });
    }

    function saveSentMessage(username, messageText) {
      Consumer.findOne({ name: username }, (err, consumer) => {
        if (err) {
          console.error("Error:", err);
          return;
        }

        consumer.messages.push({ text: messageText, sender: username });
        consumer.save((err) => {
          if (err) {
            console.error("Error saving message:", err);
          }
        });
      });
    }

    function saveReceivedMessage(data) {
      const senderName = data.username;
      const messageText = data.text;

      Consumer.findOne({ name: senderName }, (err, consumer) => {
        if (err) {
          console.error("Error:", err);
          return;
        }

        consumer.messages.push({ text: messageText, sender: senderName });
        consumer.save((err) => {
          if (err) {
            console.error("Error saving received message:", err);
          }
        });
      });
    }

    async function retrieveAndDisplaySavedMessages() {
      try {
        const response = await fetch("/getSavedMessages");
        if (response.ok) {
          const messages = await response.json();
          console.log("Retrieved messages:", messages);

          messages.forEach((message) => {
            const messageData = {
              username: message.username,
              text: message.text,
            };
            if (message.username === username) {
              // You sent this message
              sendingMessage(messageData, "reversed"); // Pass "reversed" class
            } else {
              // You received this message
              receiveMessage(messageData);
            }
          });
        } else {
          console.error("Failed to fetch saved messages");
        }
      } catch (error) {
        console.error("Error fetching saved messages:", error);
      }
    }

    function createMessageContainer(data, username, modifier = "") {
      const messageContainer = document.createElement("div");
      messageContainer.classList.add(
        "chat__conversation-board__message-container"
      );

      if (modifier.trim() !== "") {
        messageContainer.classList.add(modifier);
      }

      const isCurrentUser = data.username === username;

      const avatarImageUrl = `https://randomuser.me/api/portraits/${
        isCurrentUser ? "men" : "women"
      }/9.jpg`;
      const senderName = data.username;
      const messageText = data.text;

      messageContainer.innerHTML = `
        <div class="chat__conversation-board__message__person">
          <div class="chat__conversation-board__message__person__avatar">
            <img src="${avatarImageUrl}" alt="${senderName}" />
          </div>
          <span class="chat__conversation-board__message__person__nickname">
            ${senderName}
          </span>
        </div>
        <div class="chat__conversation-board__message__context">
          <div class="chat__conversation-board__message__bubble">
            <span>${messageText}</span>
          </div>
        </div>
      `;

      return messageContainer;
    }

    function receiveMessage(data) {
      if (data.username !== username) {
        const messageContainer = createMessageContainer(data, username);
        conversationBoard.appendChild(messageContainer);
        conversationBoard.scrollTop = conversationBoard.scrollHeight;
      }
    }

    function sendingMessage(data) {
      const messageContainer = createMessageContainer(
        data,
        username,
        "reversed"
      );
      conversationBoard.appendChild(messageContainer);
      conversationBoard.scrollTop = conversationBoard.scrollHeight;
    }

    function showUserJoined(newUser) {
      const messageContainer = createjoin(newUser);
      conversationBoard.appendChild(messageContainer);
      conversationBoard.scrollTop = conversationBoard.scrollHeight;
    }

    function createjoin(newUser) {
      const messageContainer = document.createElement("div");
      messageContainer.classList.add(
        "chat__conversation-board__message-container",
        "join"
      );

      const messageContext = document.createElement("div");
      messageContext.classList.add(
        "chat__conversation-board__message__context"
      );

      const messageBubble = document.createElement("div");
      messageBubble.classList.add("chat__conversation-board__message__bubble");
      messageBubble.innerHTML = `<span>${newUser} joined</span>`;

      messageContext.appendChild(messageBubble);
      messageContainer.appendChild(messageContext);

      return messageContainer;
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
