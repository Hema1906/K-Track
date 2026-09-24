// ===== Attend-It · Login =====

(function(){

  const $ = s => document.querySelector(s);


  const toast = (msg, type="ok") => {

    const t = $("#toast");

    t.textContent = msg;
    t.className = "toast show " + type;

    setTimeout(() => {
      t.classList.remove("show");
    }, 2400);

  };


  const showLoader = on => {

    $("#loader").classList.toggle(
      "hidden",
      !on
    );

  };


  // Already logged in
  if(localStorage.getItem("nexus.session")){

    location.replace("dashboard.html");

    return;

  }


  // Remembered username
  const remembered =
    localStorage.getItem("nexus.remember");

  if(remembered){

    $("#username").value = remembered;

    $("#remember").checked = true;

  }


  // Ripple effect
  document.addEventListener("click", e => {

    const b = e.target.closest(".ripple");

    if(!b) return;

    const r = b.getBoundingClientRect();

    const ink = document.createElement("span");

    ink.className = "ink";

    const d = Math.max(
      r.width,
      r.height
    );

    ink.style.width =
      ink.style.height =
      d + "px";

    ink.style.left =
      (e.clientX - r.left - d / 2) + "px";

    ink.style.top =
      (e.clientY - r.top - d / 2) + "px";

    b.appendChild(ink);

    setTimeout(() => ink.remove(),600);

  });


  // Show / hide password
  $("#togglePw").addEventListener("click", () => {

    const input = $("#password");

    input.type =
      input.type === "password"
      ? "text"
      : "password";

  });


  // Forgot password
  $("#forgot").addEventListener("click", e => {

    e.preventDefault();

    toast(
      "Password reset link sent to your work email",
      "ok"
    );

  });


  // Login
  $("#loginForm").addEventListener("submit", e => {

    e.preventDefault();


    const username =
      $("#username").value.trim();

    const password =
      $("#password").value;


    if(!username || !password){

      toast(
        "Please enter Login ID and Password",
        "err"
      );

      return;

    }


    if(password.length < 4){

      toast(
        "Password too short",
        "err"
      );

      return;

    }


    // Check if account exists
    const account =
      JSON.parse(
        localStorage.getItem("nexus.account") || "null"
      );


    if(!account){

      toast(
        "Please create an account first",
        "err"
      );

      return;

    }


    // Check credentials
    if(
      username !== account.username ||
      password !== account.password
    ){

      toast(
        "Invalid Login ID or Password",
        "err"
      );

      return;

    }


    // Get saved profile
    const profile =
      JSON.parse(
        localStorage.getItem("nexus.profile") || "{}"
      );


    // Create session
    const session = {

      username: username,

      name: profile.name || "Employee",

      loginAt:
        new Date().toISOString()

    };


    localStorage.setItem(
      "nexus.session",
      JSON.stringify(session)
    );


    // Remember username
    if($("#remember").checked){

      localStorage.setItem(
        "nexus.remember",
        username
      );

    }else{

      localStorage.removeItem(
        "nexus.remember"
      );

    }


    showLoader(true);


    setTimeout(() => {

      showLoader(false);

      toast(
        "Welcome back!",
        "ok"
      );


      setTimeout(() => {

        location.replace(
          "dashboard.html"
        );

      },400);

    },700);

  });

})();