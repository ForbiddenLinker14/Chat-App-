const inputs = document.querySelectorAll(".input-field");
const toggle_btn = document.querySelectorAll(".toggle");
const main = document.querySelector("main");
const bullets = document.querySelectorAll(".bullets span");
const images = document.querySelectorAll(".image");

inputs.forEach((inp) => {
  inp.addEventListener("focus", () => {
    inp.classList.add("active");
  });
  inp.addEventListener("blur", () => {
    if (inp.value != "") return;
    inp.classList.remove("active");
  });
});

toggle_btn.forEach((btn) => {
  btn.addEventListener("click", () => {
    main.classList.toggle("sign-up-mode");
  });
});

function moveSlider() {
  let index = this.dataset.value;

  let currentImage = document.querySelector(`.img-${index}`);
  images.forEach((img) => img.classList.remove("show"));
  currentImage.classList.add("show");

  const textSlider = document.querySelector(".text-group");
  textSlider.style.transform = `translateY(${-(index - 1) * 2.2}rem)`;

  bullets.forEach((bull) => bull.classList.remove("active"));
  this.classList.add("active");
}

bullets.forEach((bullet) => {
  bullet.addEventListener("click", moveSlider);
});

async function register(event) {
  event.preventDefault(); // Prevent the default form submission

  const name = document.getElementById("reg").value;
  const email = document.getElementById("reg1").value;
  const password = document.getElementById("reg2").value;

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      const result = await response.json();
      alert(result.message); // Show a message to the user
      document.getElementById("reg").value = "";
      document.getElementById("reg1").value = "";
      document.getElementById("reg2").value = "";
    } else if (response.status === 400) {
      const errorResult = await response.json();
      alert(errorResult.message); // Show an error message for existing email
    } else {
      console.error("Registration failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log("Login Successful");
        // Redirect the user here
        window.location.href = "/index.html";
      }
    } else if (response.status === 401) {
      const errorText = await response.text();
      if (errorText === "Invalid email") {
        alert("Wrong email entered. Please try again.");
      } else if (errorText === "Invalid password") {
        alert("Wrong password entered. Please try again.");
      } else if (errorText === "Invalid credentials") {
        alert("Sign up first");
      }
    } else {
      console.error("Login failed");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
