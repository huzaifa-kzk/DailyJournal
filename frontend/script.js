const API = window.location.origin + "/api";
const MAX_FILE_SIZE_MB = 20;

async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(API + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    alert(data.message);
  } catch (err) {
    console.error("Signup error:", err);
    alert("Server error. Try again.");
  }
}

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

async function createPost() {
  const token = localStorage.getItem("token");
  const contentInput = document.getElementById("content");
  const fileInput = document.getElementById("image");
  const content = contentInput.value.trim();

  if (!token) {
    alert("Please login first");
    return;
  }

  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      fileInput.value = "";
      return;
    }
  }

  if (!content && (!fileInput || !fileInput.files.length)) {
    return;
  }

  try {
    const formData = new FormData();
    formData.append("content", content);

    if (fileInput && fileInput.files.length > 0) {
      formData.append("image", fileInput.files[0]);
    }

    const res = await fetch(API + "/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 413) {
        throw new Error("File too large for server");
      }

      const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || "Error creating post");
    }

    contentInput.value = "";
    if (fileInput) fileInput.value = "";

    loadPosts();
    contentInput.focus();
  } catch (err) {
    console.error("Post error:", err);
    alert("Error creating post: " + err.message);
  }
}

function formatMessageTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const timeString = `${hours}:${minutes} ${ampm}`;

  if (date.toDateString() === now.toDateString()) {
    return `Today at ${timeString}`;
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${timeString}`;
  }

  const options = { month: "short", day: "numeric", year: "numeric" };
  return `${date.toLocaleDateString("en-US", options)} at ${timeString}`;
}

async function loadPosts() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location = "login.html";
    return;
  }

  let userId = null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId = payload.id;
  } catch (err) {
    console.error("Error decoding token:", err);
    localStorage.removeItem("token");
    window.location = "login.html";
    return;
  }

  try {
    const res = await fetch(API + "/posts", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 403) {
      localStorage.removeItem("token");
      window.location = "login.html";
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    const data = await res.json();
    const postsDiv = document.getElementById("posts");
    if (!postsDiv) return;

    postsDiv.replaceChildren();

    data.forEach((p) => {
      const isMyMessage = userId === p.user_id;
      const message = document.createElement("div");
      message.className = `message ${isMyMessage ? "my-message" : "other-message"}`;

      const header = document.createElement("div");
      header.className = "message-header";

      const name = document.createElement("b");
      name.textContent = p.name || "Unknown";

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = ` - ${formatMessageTime(p.created_at)}`;

      header.append(name, date);

      const content = document.createElement("div");
      content.className = "message-content";

      if (p.content) {
        const text = document.createElement("p");
        text.textContent = p.content;
        content.appendChild(text);
      }

      if (p.image_url) {
        try {
          const imageUrl = new URL(p.image_url, window.location.origin);

          if (imageUrl.protocol === "https:" || imageUrl.protocol === "http:") {
            const img = document.createElement("img");
            img.src = imageUrl.href;
            img.alt = "Uploaded image";
            img.className = "chat-image";
            content.appendChild(img);
          }
        } catch (err) {
          console.error("Invalid image URL:", err);
        }
      }

      message.append(header, content);

      if (isMyMessage) {
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePost(p.id));
        message.appendChild(deleteButton);
      }

      postsDiv.appendChild(message);
    });

    postsDiv.scrollTop = postsDiv.scrollHeight;
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

async function deletePost(postId) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    return;
  }

  try {
    const res = await fetch(`${API}/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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

function logout() {
  localStorage.removeItem("token");
  window.location = "login.html";
}

if (window.location.pathname.includes("dashboard")) {
  loadPosts();
  setInterval(loadPosts, 5000);
}

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

  const fileInput = document.getElementById("image");

  if (fileInput) {
    fileInput.addEventListener("change", function () {
      if (this.files.length === 0) return;

      const fileSizeMB = this.files[0].size / (1024 * 1024);

      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        alert(`Warning: this file is ${fileSizeMB.toFixed(2)}MB. Max allowed is ${MAX_FILE_SIZE_MB}MB.`);
      }
    });
  }
});
