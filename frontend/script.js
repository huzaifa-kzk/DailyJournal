// Automatically works for localhost AND EC2
const API = window.location.origin + "/api";
const MAX_FILE_SIZE_MB = 20; // Match your backend limit

/* ===================== SIGNUP ===================== */
async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    alert(data.message);

  } catch (err) {
    console.error("Signup error:", err);
    alert("Server error. Try again.");
  }
}

/* ===================== LOGIN ===================== */
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location = "dashboard.html";
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error("Login error:", err);
    alert("Server error. Try again.");
  }
}

/* ===================== CREATE POST ===================== */
async function createPost() {
  const token = localStorage.getItem("token");
  const contentInput = document.getElementById("content");
  const fileInput = document.getElementById("image");
  const content = contentInput.value.trim();

  if (!token) {
    alert("Please login first");
    return;
  }

  // Check file size before uploading
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File too large! Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${fileSizeMB.toFixed(2)}MB`);
      fileInput.value = ""; // Clear the file input
      return;
    }
    
    // Optional: Show file info
    console.log(`Uploading: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
  }

  if (!content && (!fileInput || !fileInput.files.length)) {
    return; // don't send empty message
  }

  try {
    // Use FormData to send text + optional image
    const formData = new FormData();
    formData.append("content", content);
    if (fileInput && fileInput.files.length > 0) {
      formData.append("image", fileInput.files[0]);
    }

    const res = await fetch(API + "/posts", {
      method: "POST",
      headers: { Authorization: token },
      body: formData,
    });

    // Check if response is OK before parsing JSON
    if (!res.ok) {
      if (res.status === 413) {
        throw new Error("File too large for server");
      }
      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || "Error creating post");
    }

    const data = await res.json();

    // ✅ Clear inputs after successful post
    contentInput.value = "";
    if (fileInput) fileInput.value = "";

    loadPosts();
    contentInput.focus();

  } catch (err) {
    console.error("Post error:", err);
    alert("Error creating post: " + err.message);
  }
}

/* ===================== HELPER FUNCTION TO FORMAT TIME ===================== */
function formatMessageTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Format time (e.g., "3:45 PM")
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const timeString = `${hours}:${minutes} ${ampm}`;
  
  // Check if it's today
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${timeString}`;
  }
  // Check if it's yesterday
  else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeString}`;
  }
  // Otherwise show the date
  else {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${date.toLocaleDateString('en-US', options)} at ${timeString}`;
  }
}

/* ===================== LOAD POSTS ===================== */
async function loadPosts() {
  const token = localStorage.getItem("token");
  let userId = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.id;
    } catch (e) {
      console.error("Error decoding token:", e);
    }
  }

  try {
    const res = await fetch(API + "/posts");
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    const postsDiv = document.getElementById("posts");
    if (!postsDiv) return;

    postsDiv.innerHTML = "";

    data.forEach((p) => {
      const isMyMessage = userId === p.user_id;

      // Format the time nicely
      const formattedTime = formatMessageTime(p.created_at);

      // Handle image if exists
      let imageHTML = "";
      if (p.image_url) {
        imageHTML = `<img src="${p.image_url}" alt="image" class="chat-image">`;
      }

      postsDiv.innerHTML += `
        <div class="message ${isMyMessage ? "my-message" : "other-message"}">
          
          <div class="message-header">
            <b>${p.name}</b>
            <span class="date"> — ${formattedTime}</span>
          </div>

          <div class="message-content">
            ${p.content ? `<p>${p.content}</p>` : ""}
            ${imageHTML}
          </div>

          ${
            isMyMessage
              ? `<button class="delete-btn" onclick="deletePost(${p.id})">Delete</button>`
              : ""
          }

        </div>
      `;
    });

    postsDiv.scrollTop = postsDiv.scrollHeight;

  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

/* ===================== DELETE POST ===================== */
async function deletePost(postId) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first");
    return;
  }

  try {
    const res = await fetch(`${API}/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: token },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Delete failed" }));
      throw new Error(errorData.message);
    }

    const data = await res.json();
    alert(data.message);
    loadPosts();
  } catch (err) {
    console.error("Delete post error:", err);
    alert("Could not delete post: " + err.message);
  }
}

/* ===================== AUTO LOAD DASHBOARD ===================== */
if (window.location.pathname.includes("dashboard")) {
  loadPosts();
  setInterval(loadPosts, 5000);
}

/* ===================== LOGOUT ===================== */
function logout() {
  localStorage.removeItem("token");
  window.location = "login.html";
}

/* ===================== ENTER TO SEND ===================== */
document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("content");
  if (textarea) {
    textarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        createPost();
      }
    });
  }

  // Optional: Add file size indicator
  const fileInput = document.getElementById("image");
  if (fileInput) {
    fileInput.addEventListener("change", function() {
      if (this.files.length > 0) {
        const fileSizeMB = this.files[0].size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          alert(`Warning: This file is ${fileSizeMB.toFixed(2)}MB. Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
        } else {
          console.log(`Selected file: ${this.files[0].name} (${fileSizeMB.toFixed(2)}MB)`);
        }
      }
    });
  }
});