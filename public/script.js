// connect to server
const socket = io("http://localhost:3000");
// track receiver
let selectedReceiverId = null;

// Need to: Add enter button functionality. Should send message


// handle receiver selection
document.getElementById("receiverSelect").addEventListener("change", (event) => {
    selectedReceiverId = event.target.value;
    const chatWith = document.getElementById("chatWith");
    // update header
    chatWith.textContent = `User ${selectedReceiverId}`;
});

// add a message to chat UI
function addMessage(content, type) {
    const messagesContainer = document.getElementById("chatMessages");

    // make new message element
    const messageElement = document.createElement("div");
    // add class
    messageElement.classList.add("message", type);
    messageElement.textContent = content;

    // add message to container
    messagesContainer.appendChild(messageElement);

    // go to bottom of chat
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// send a message
document.getElementById("sendButton").addEventListener("click", () => {
    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value;

    if (!selectedReceiverId) {
        alert("Please select a user to chat with!");
        return;
    }

    // add sent message to UI
    addMessage(message, "sent");

    // emit the message to the server
    socket.emit("sendMessage", {
        senderId: 1, // repl. w/ logged-in user ID
        receiverId: parseInt(selectedReceiverId), // convert receiver ID to number
        content: message,
    });

    // clear input field
    messageInput.value = "";
});

// listen for new messages from the server
socket.on("newMessage", (data) => {
    if (parseInt(data.receiverId) === 1 || parseInt(data.senderId) === 1) {
        // add received messages to the UI
        addMessage(data.content, "received");
    }
});
