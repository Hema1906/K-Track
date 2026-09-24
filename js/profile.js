(function(){

  const $ = s => document.querySelector(s);

  // =========================
  // CHECK LOGIN
  // =========================

  const session = JSON.parse(
    localStorage.getItem("nexus.session") || "null"
  );

  if (!session) {
    location.replace("index.html");
    return;
  }


  // =========================
  // TOAST
  // =========================

  const toast = (msg, type="ok") => {

    const t = $("#toast");

    if (!t) return;

    t.textContent = msg;
    t.className = "toast show " + type;

    setTimeout(() => {
      t.classList.remove("show");
    }, 2000);

  };


  // =========================
  // RIPPLE EFFECT
  // =========================

  document.addEventListener("click", e => {

    const b = e.target.closest(".ripple");

    if (!b) return;

    const r = b.getBoundingClientRect();

    const ink = document.createElement("span");

    ink.className = "ink";

    const d = Math.max(r.width, r.height);

    ink.style.width = ink.style.height = d + "px";

    ink.style.left =
      (e.clientX - r.left - d / 2) + "px";

    ink.style.top =
      (e.clientY - r.top - d / 2) + "px";

    b.appendChild(ink);

    setTimeout(() => ink.remove(), 600);

  });


  // =========================
  // SIDEBAR
  // =========================

  $("#menuBtn")?.addEventListener("click", () => {

    $("#sidebar").classList.toggle("open");

  });


  // =========================
  // LOGOUT
  // =========================

  $("#logoutBtn")?.addEventListener("click", () => {

    localStorage.removeItem("nexus.session");

    location.replace("index.html");

  });


  // =========================
  // DEFAULT PROFILE
  // =========================

  const defaults = {

    name: "Jane Doe",

    id: "EMP-00421",

    email: "jane.doe@nexus.com",

    phone: "+91 98765 43210",

    dept: "Engineering",

    designation: "Senior Engineer",

    manager: "Arjun Mehta",

    joining: "2022-01-17",

    photo: ""

  };


  // =========================
  // LOAD SAVED PROFILE
  // =========================

  let profile = Object.assign(

    {},

    defaults,

    JSON.parse(
      localStorage.getItem("nexus.profile") || "{}"
    )

  );


  // =========================
  // ONLY FIELDS THAT EXIST
  // IN YOUR profile.html
  // =========================

  const fields = {

    fName: "name",

    fId: "id",

    fEmail: "email",

    fPhone: "phone",

    fDept: "dept",

    fDesig: "designation",

    fManager: "manager",

    fJoin: "joining"

  };


  // =========================
  // EDIT MODE
  // =========================

  let editing = false;


  function setEditing(on) {

    editing = on;


    // Enable / disable ALL profile inputs

    Object.keys(fields).forEach(id => {

      const input = $("#" + id);

      if (input) {

        input.disabled = !on;

      }

    });


    // Edit button

    const editBtn = $("#editBtn");

    if (editBtn) {

      editBtn.textContent =
        on ? "Editing…" : "Edit Profile";

    }


    // Save button

    const saveBtn = $("#saveBtn");

    if (saveBtn) {

      saveBtn.disabled = !on;

      saveBtn.style.opacity = on ? "1" : ".5";

    }


    // Cancel button

    const cancelBtn = $("#cancelBtn");

    if (cancelBtn) {

      cancelBtn.disabled = !on;

      cancelBtn.style.opacity = on ? "1" : ".5";

    }

  }


  // =========================
  // DISPLAY PROFILE
  // =========================

  function paint() {

    const initials = (profile.name || "JD")
      .split(/\s+/)
      .map(s => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();


    const topAv = $("#topAvatar");

    const bigAv = $("#bigAvatar");


    [topAv, bigAv].forEach(el => {

      if (!el) return;


      if (profile.photo) {

        el.style.backgroundImage =
          `url(${profile.photo})`;

        el.textContent = "";

      } else {

        el.style.backgroundImage = "";

        el.textContent = initials;

      }

    });


    // Hero information

    $("#pName").textContent =
      profile.name || "—";


    $("#pRole").textContent =
      `${profile.designation || "—"} · ${profile.dept || "—"}`;


    $("#pId").textContent =
      profile.id || "—";


    // Joining date

    const jd = new Date(profile.joining);


    $("#pJoin").textContent =

      isNaN(jd)

        ? "Joined —"

        : "Joined " +
          jd.toLocaleDateString(undefined, {

            month: "short",

            year: "numeric"

          });


    // Put saved values into inputs

    Object.entries(fields).forEach(([id, key]) => {

      const input = $("#" + id);

      if (input) {

        input.value = profile[key] || "";

      }

    });


    // IMPORTANT:
    // Page starts locked

    setEditing(false);

  }


  // =========================
  // EDIT PROFILE
  // =========================

  $("#editBtn")?.addEventListener("click", () => {

    setEditing(true);

    $("#fName")?.focus();

    toast("You can now edit your profile", "ok");

  });


  // =========================
  // CANCEL
  // =========================

  $("#cancelBtn")?.addEventListener("click", () => {

    // Reload original saved values

    profile = Object.assign(

      {},

      defaults,

      JSON.parse(
        localStorage.getItem("nexus.profile") || "{}"
      )

    );


    paint();

    toast("Changes discarded", "ok");

  });


  // =========================
  // SAVE CHANGES
  // =========================

  $("#profileForm")?.addEventListener("submit", e => {

    e.preventDefault();


    if (!editing) return;


    // Get new values from inputs

    Object.entries(fields).forEach(([id, key]) => {

      const input = $("#" + id);

      if (input) {

        profile[key] = input.value.trim();

      }

    });


    // SAVE TO LOCAL STORAGE

    localStorage.setItem(

      "nexus.profile",

      JSON.stringify(profile)

    );


    // Reload saved data

    profile = Object.assign(

      {},

      defaults,

      JSON.parse(
        localStorage.getItem("nexus.profile") || "{}"
      )

    );


    // Lock fields again

    paint();


    toast("Profile saved successfully!", "ok");

  });


  // =========================
  // CHANGE PHOTO
  // =========================

  $("#changePhotoBtn")?.addEventListener(
    "click",
    () => $("#photoInput")?.click()
  );


  $("#photoInput")?.addEventListener(
    "change",
    e => {

      const file = e.target.files?.[0];

      if (!file) return;


      const reader = new FileReader();


      reader.onload = ev => {

        profile.photo = ev.target.result;


        localStorage.setItem(

          "nexus.profile",

          JSON.stringify(profile)

        );


        paint();

        toast("Photo updated", "ok");

      };


      reader.readAsDataURL(file);

    }

  );


  // =========================
  // INITIAL LOAD
  // =========================

  paint();

})();