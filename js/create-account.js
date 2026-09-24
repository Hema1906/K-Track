// ===== Attend-It · Create Account =====

(function(){

  const $ = s => document.querySelector(s);

  const toast = (msg, type="ok") => {

    const t = $("#toast");

    t.textContent = msg;
    t.className = "toast show " + type;

    setTimeout(() => {
      t.classList.remove("show");
    }, 2200);

  };


  $("#createForm").addEventListener("submit", function(e){

    e.preventDefault();


    // Get values
    const name = $("#name").value.trim();
    const employeeId = $("#employeeId").value.trim();
    const email = $("#email").value.trim();
    const phone = $("#phone").value.trim();

    const department = $("#department").value.trim();
    const designation = $("#designation").value.trim();
    const manager = $("#manager").value.trim();
    const joining = $("#joining").value;

    const loginId = $("#loginId").value.trim();
    const password = $("#password").value;
    const confirmPassword = $("#confirmPassword").value;


    // Check password
    if(password.length < 4){

      toast("Password must be at least 4 characters", "err");

      return;

    }


    if(password !== confirmPassword){

      toast("Passwords do not match", "err");

      return;

    }


    // Save login details
    const account = {

      username: loginId,

      password: password

    };


    localStorage.setItem(
      "nexus.account",
      JSON.stringify(account)
    );


    // Save profile details
    const profile = {

      name: name,

      id: employeeId,

      email: email,

      phone: phone,

      dept: department,

      designation: designation,

      manager: manager,

      joining: joining,

      photo: ""

    };


    localStorage.setItem(
      "nexus.profile",
      JSON.stringify(profile)
    );


    // Create login session
    const session = {

      username: loginId,

      name: name,

      loginAt: new Date().toISOString()

    };


    localStorage.setItem(
      "nexus.session",
      JSON.stringify(session)
    );


    // Account setup completed
    localStorage.setItem(
      "nexus.setupComplete",
      "true"
    );


    toast("Account created successfully!", "ok");


    // Go to dashboard
    setTimeout(() => {

      location.replace("dashboard.html");

    }, 500);

  });

})();