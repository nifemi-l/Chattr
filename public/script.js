// connect to server
const socket = io("http://localhost:3000");

// track receiver
let selectedReceiverId = null;

const messagesContainer = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");

let typingTimeout;

// emit typing event once user starts typing 
messageInput.addEventListener("input", () => { 
    // make sure receiver is selected
    if (!selectedReceiverId) return;

    // emit typing event to server
    socket.emit("userTyping", {
        senderId: 1, 
        receiverId: parseInt(selectedReceiverId),
    })

    // reset timeout
    clearTimeout(typingTimeout);

    // emit typing stoppage event after 2s of kb inactivity
    typingTimeout = setTimeout(() => { 
        socket.emit("stopTyping", {
            senderId: 1,
            receiverId: parseInt(selectedReceiverId),
        });
    }, 2000); 
})

// add a message to chat UI
function addMessage(content, type) {
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

// send message to user
function sendMessage() {
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
}

// DOM event listeners 

// listen for request to send message
document.getElementById("sendButton").addEventListener("click", () => {
    sendMessage();
});

// enter functionality
document.addEventListener('keydown', (event) => { 
    if (event.key === "Enter") { 
        // send the message
        sendMessage()
    }
});

// handle receiver selection
document.getElementById("receiverSelect").addEventListener("change", (event) => {
    selectedReceiverId = event.target.value;
    const chatWith = document.getElementById("chatWith");
    // update header
    chatWith.textContent = `User ${selectedReceiverId}`;
});


// Socket event listeners 

// listen for new messages from the server
socket.on("newMessage", (data) => {
    if (parseInt(data.receiverId) === 1 || parseInt(data.senderId) === 1) {
        // add received messages to the UI
        addMessage(data.content, "received");
    }
});

// typing animations
socket.on("userTyping", (data) => { 
    // avoid showing it for current user (will need to change)
    if (data.senderId !== 1) { 
        showTypingAnimation();
    }
});

socket.on('stopTyping', (data) => { 
    if (data.senderId !== 1) { 
        hideTypingAnimation();
    }
})