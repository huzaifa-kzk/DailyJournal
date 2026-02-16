const API = "http://localhost:3000/api";

/* SIGNUP */
async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  alert(data.message);
}


/* LOGIN */
async function login() {
  const res = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
    }),
  });

  const data = await res.json();

  localStorage.setItem("token", data.token);

  window.location = "dashboard.html";
}

/* POST */
async function post() {
  const token = localStorage.getItem("token");

  const res = await fetch(API + "/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({
      content: content.value,
    }),
  });

  alert((await res.json()).message);
}

/* LOAD POSTS */
async function loadPosts() {
  try {
    const res = await fetch(API + "/posts");
    const data = await res.json();

    const postsDiv = document.getElementById("posts");
    postsDiv.innerHTML = ""; // Clear previous posts

    data.forEach((p) => {
      postsDiv.innerHTML += `
        <div class="post">
          <b>${p.name}</b> <span class="date">${p.created_at}</span>
          <p>${p.content}</p>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// Initial load
if (window.location.pathname.includes("dashboard")) {
  loadPosts();

  // Refresh every second (1000ms)
  setInterval(loadPosts, 1000);
}


/* LOGOUT */
function logout() {
  localStorage.removeItem("token");
  window.location = "login.html";
}