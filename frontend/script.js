// Automatically works for localhost AND EC2
const API = window.location.origin + "/api";

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
  const content = document.getElementById("content").value;

  if (!token) {
    alert("Please login first");
    return;
  }

  try {
    const res = await fetch(API + "/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ content }),
    });

    const data = await res.json();
    alert(data.message);
    
    loadPosts();

  } catch (err) {
    console.error("Post error:", err);
    alert("Error creating post");
  }
}

/* ===================== LOAD POSTS ===================== */
async function loadPosts() {
  const token = localStorage.getItem("token");
  let userId = null;

  // Decode JWT to get current user id
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId = payload.id;
  }

  try {
    const res = await fetch(API + "/posts");
    const data = await res.json();

    const postsDiv = document.getElementById("posts");
    if (!postsDiv) return;

    postsDiv.innerHTML = "";

    data.forEach((p) => {
      postsDiv.innerHTML += `
        <div class="post">
          <b>${p.name}</b> 
          <span class="date">${p.created_at}</span>
          <p>${p.content}</p>
          ${
            userId === p.user_id
              ? `<button class="delete-btn" onclick="deletePost(${p.id})">Delete</button>`
              : ""
          }
        </div>
      `;
    });
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

    const data = await res.json();
    alert(data.message);
    loadPosts();
  } catch (err) {
    console.error("Delete post error:", err);
    alert("Could not delete post");
  }
}
/* ===================== AUTO LOAD DASHBOARD ===================== */
if (window.location.pathname.includes("dashboard")) {
  loadPosts();
  setInterval(loadPosts, 5000); // refresh every 5 seconds
}

/* ===================== LOGOUT ===================== */
function logout() {
  localStorage.removeItem("token");
  window.location = "login.html";
}