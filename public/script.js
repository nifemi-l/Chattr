// connect to server
const socket = io("http://localhost:3000");

// track sender & receiver
let selectedSenderId = null; // actual user
let selectedReceiverId = null; // receiving user

// common references
const messagesContainer = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const typingContainer = document.querySelector(".ticontainer");

let typingTimeout;

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

    if (!selectedSenderId || !selectedReceiverId) {
        alert("Please select both a sender and a receiver!");
        return;
    }

    // add sent message to UI
    addMessage(message, "sent");

    // emit the message to the server
    socket.emit("sendMessage", {
        senderId: parseInt(selectedSenderId),
        receiverId: parseInt(selectedReceiverId),
        content: message,
    });

    // clear input field
    messageInput.value = "";
}

function showTypingAnimation() { 
    if (typingContainer) { 
        typingContainer.style.display = "block";
    }
}

function hideTypingAnimation() { 
    if (typingContainer) { 
        typingContainer.style.display = "none";
    }
}

// DOM event listeners 

// emit typing event
messageInput.addEventListener("input", () => { 
    // make sure receiver is selected
    if (!selectedSenderId || !selectedReceiverId) return;

    // emit typing event to server
    socket.emit("userTyping", {
        senderId: parseInt(selectedSenderId), 
        receiverId: parseInt(selectedReceiverId),
    })

    // reset timeout
    clearTimeout(typingTimeout);

    // emit typing stoppage event after 2s of kb inactivity
    typingTimeout = setTimeout(() => { 
        socket.emit("stopTyping", {
            senderId: parseInt(selectedSenderId),
            receiverId: parseInt(selectedReceiverId),
        });
    }, 2000); 
});

// listen for request to send message
document.getElementById("sendButton").addEventListener("click", () => {
    sendMessage();
});

// handle sender selection
document.getElementById("senderSelect").addEventListener("change", (event) => { 
    selectedSenderId = event.target.value;
});

// handle receiver selection
document.getElementById("receiverSelect").addEventListener("change", (event) => {
    selectedReceiverId = event.target.value;
    const chatWith = document.getElementById("chatWith");
    // update header
    chatWith.textContent = `User ${selectedReceiverId}`;
});

// enter key functionality
document.addEventListener('keydown', (event) => { 
    if (event.key === "Enter") { 
        // send the message
        sendMessage()
    }
});

// socket event listeners 

// listen for new messages from the server
socket.on("newMessage", (data) => {
    // sent to you: if the logged-in user is the receiver of the message
    // sent by you: if the logged-in user is the sender of the message 
    if (parseInt(data.receiverId) === parseInt(selectedSenderId) || parseInt(data.senderId) === parseInt(selectedSenderId)) {
        // add received messages to the UI
        addMessage(data.content, "received");
    }
});

// typing animations
// animations only show up for correct sender and receiver combination
socket.on("userTyping", (data) => { 
    if (data.receiverId === parseInt(selectedSenderId) && data.senderId === parseInt(selectedReceiverId)) { 
        showTypingAnimation();
    }
});

socket.on('stopTyping', (data) => { 
    if (data.receiverId === parseInt(selectedSenderId) && data.senderId === parseInt(selectedReceiverId)) { 
        hideTypingAnimation();
    }
});