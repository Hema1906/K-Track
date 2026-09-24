// ===== Attend-it · Attendance =====

(function () {

  const $ = s => document.querySelector(s);


  // =========================================================
  // SESSION
  // =========================================================

  const session = JSON.parse(
    localStorage.getItem("nexus.session") || "null"
  );

  if (!session) {
    location.replace("index.html");
    return;
  }


 


  // =========================================================
  // RIPPLE
  // =========================================================

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


  // =========================================================
  // MENU
  // =========================================================

  $("#menuBtn")?.addEventListener("click", () => {

    $("#sidebar").classList.toggle("open");

  });


  // =========================================================
  // LOGOUT
  // =========================================================

  $("#logoutBtn").addEventListener("click", () => {

    localStorage.removeItem("nexus.session");

    location.replace("index.html");

  });


  // =========================================================
  // AVATAR
  // =========================================================

  const profile = JSON.parse(
    localStorage.getItem("nexus.profile") || "{}"
  );

  const initials =
    (profile.name || "Jane Doe")
      .split(/\s+/)
      .map(s => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const av = $("#topAvatar");

  if (profile.photo) {

    av.style.backgroundImage =
      `url(${profile.photo})`;

    av.textContent = "";

  } else {

    av.textContent = initials;

  }


  // =========================================================
  // HOLIDAY SYSTEM
  // =========================================================

 /*
    IMPORTANT:

    There are NO hardcoded holidays anymore.

    Holidays are loaded automatically from holiday.xlsx
    stored in the Attend-it project folder.
*/

  let holidayRegistry = JSON.parse(
    localStorage.getItem("nexus.holidays") || "{}"
  );


  // =========================================================
// LOAD HOLIDAYS AUTOMATICALLY FROM holiday.xlsx
// =========================================================

async function loadHolidayExcel() {

  try {

    if (typeof XLSX === "undefined") {
      return;
    }

    // Load holiday.xlsx from Attend-it root folder
    const response = await fetch("./holiday.xlsx", {
  cache: "no-store"
});

    if (!response.ok) {
      throw new Error("holiday.xlsx not found");
    }

    const buffer = await response.arrayBuffer();

    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: true
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(
      worksheet,
      {
        defval: ""
      }
    );

    if (!rows.length) {
      return;
    }

    const newRegistry = {};

    let validRows = 0;

    rows.forEach(row => {

      const dateValue =
        row.Date ??
        row.date ??
        row.DATE;

      const holidayName =
        row.Holiday ??
        row.holiday ??
        row.HOLIDAY ??
        "Holiday";

      const typeValue =
        row.Type ??
        row.type ??
        row.TYPE ??
        "";

      const dateKey =
        normalizeExcelDate(dateValue);

      if (!dateKey) return;

      const typeText =
        String(typeValue)
          .trim()
          .toLowerCase();

      const isOptional =
        typeText.includes("optional");

      newRegistry[dateKey] = {

        name:
          String(holidayName).trim()
          || "Holiday",

        type:
          isOptional
            ? "optional"
            : "mandatory"

      };

      validRows++;

    });

    if (!validRows) {
      return;
    }

    // Replace holiday registry
    holidayRegistry = newRegistry;

    // Save extracted data locally
    localStorage.setItem(
      "nexus.holidays",
      JSON.stringify(holidayRegistry)
    );

    console.log(
      `${validRows} holidays loaded from holiday.xlsx`
    );

    const status = $("#holidayStatus");
    if (status) {
      status.textContent = `📅 Holiday calendar loaded (${validRows} holidays)`;
    }

    // Recalculate month
    updateMonthDefaults();

    render();

  } catch (error) {

    console.error(
      "Holiday Excel error:",
      error
    );

    const status = $("#holidayStatus");
    if (status) {
      status.textContent = "⚠️ Holiday calendar failed to load";
    }

  }

}


  // =========================================================
  // EXCEL DATE NORMALIZER
  // =========================================================

  function normalizeExcelDate(value) {

    if (!value && value !== 0) {
      return null;
    }


    // If SheetJS already converted it to Date

    if (value instanceof Date) {

      if (isNaN(value.getTime())) {
        return null;
      }

      return dayKey(value);

    }


    // Excel serial number

    if (typeof value === "number") {

      const date =
        XLSX.SSF.parse_date_code(value);

      if (!date) return null;

      const d =
        new Date(
          date.y,
          date.m - 1,
          date.d
        );

      return dayKey(d);

    }


    // String date

    let text =
      String(value).trim();


    if (!text) return null;


    /*
      Handles:

      01-01-2026
      01/01/2026
      2026-01-01
      01-01-26
      01/01/26
    */


    let match =
      text.match(
        /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/
      );


    if (match) {

      let day =
        Number(match[1]);

      let month =
        Number(match[2]);

      let year =
        Number(match[3]);


      if (year < 100) {
        year += 2000;
      }


      const d =
        new Date(
          year,
          month - 1,
          day
        );


      if (
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {

        return dayKey(d);

      }

    }


    // ISO format

    const parsed =
      new Date(text);


    if (!isNaN(parsed.getTime())) {

      return dayKey(parsed);

    }


    return null;

  }


  // =========================================================
  // CURRENT MONTH
  // =========================================================

  const now = new Date();

  let currentKey =
    monthKey(now);


  const planKey = () =>
    "nexus.plan." + currentKey;


  const attKey = () =>
    "nexus.att." + currentKey;


  let plan =
    JSON.parse(
      localStorage.getItem(planKey()) || "null"
    );


  let att =
    JSON.parse(
      localStorage.getItem(attKey()) || "null"
    );


  function loadMonth() {

    plan =
      JSON.parse(
        localStorage.getItem(planKey()) || "null"
      );


    att =
      JSON.parse(
        localStorage.getItem(attKey()) ||
        '{"days":{}}'
      );


    if (!plan) {

      updateMonthDefaults();

      render();

    } else {

      render();

    }

  }


  // =========================================================
  // SETUP MODAL
  // =========================================================

  const setupModal = $("#setupModal");

  const setMonth = $("#setMonth");

  const setWorking = $("#setWorking");

  const setOffice = $("#setOffice");

  const setWfh = $("#setWfh");

  const setLeave = $("#setLeave");


  // =========================================================
  // DEFAULT MONTH VALUES
  // =========================================================

  function updateMonthDefaults() {

    if (!setMonth.value) return;


    const [year, month] =
      setMonth.value
        .split("-")
        .map(Number);


    const working =
      getWorkingDays(
        year,
        month - 1
      );


    setWorking.value =
      working;


    const total =
      Math.max(
        0,
        working -
        (+setLeave.value || 0)
      );


    setOffice.value =
      Math.ceil(total / 2);


    setWfh.value =
      Math.floor(total / 2);

  }


  // =========================================================
  // SETUP MODAL
  // =========================================================

  function openSetup(prefill = true) {

    setMonth.value =
      currentKey;


    if (
      prefill &&
      plan
    ) {

      setWorking.value =
        plan.working;

      setOffice.value =
        plan.office;

      setWfh.value =
        plan.wfh;

      setLeave.value =
        plan.leave;

    } else {

      setLeave.value = 0;

      updateMonthDefaults();

    }


    setupModal.classList.add("show");

  }


  function closeSetup() {

    setupModal.classList.remove("show");

  }


  $("#closeSetup")
    .addEventListener(
      "click",
      closeSetup
    );


  setMonth
    .addEventListener(
      "change",
      updateMonthDefaults
    );


  // =========================================================
  // OFFICE INPUT
  // =========================================================

  setOffice.addEventListener(
    "input",
    () => {

      const total =
        (+setWorking.value || 0) -
        (+setLeave.value || 0);


      let office =
        +setOffice.value || 0;


      office =
        Math.max(
          0,
          Math.min(
            office,
            total
          )
        );


      setOffice.value =
        office;


      setWfh.value =
        total - office;

    }
  );


  // =========================================================
  // LEAVE INPUT
  // =========================================================

  setLeave.addEventListener(
    "input",
    () => {

      const total =
        Math.max(
          0,
          (+setWorking.value || 0) -
          (+setLeave.value || 0)
        );


      setOffice.value =
        Math.ceil(total / 2);


      setWfh.value =
        Math.floor(total / 2);

    }
  );


  // =========================================================
  // WFH INPUT
  // =========================================================

  setWfh.addEventListener(
    "input",
    () => {

      const total =
        (+setWorking.value || 0) -
        (+setLeave.value || 0);


      let wfh =
        +setWfh.value || 0;


      wfh =
        Math.max(
          0,
          Math.min(
            wfh,
            total
          )
        );


      setWfh.value =
        wfh;


      setOffice.value =
        total - wfh;

    }
  );


  // =========================================================
  // FIRST TIME
  // =========================================================


  // =========================================================
  // RECONFIGURE
  // =========================================================

  $("#reconfigBtn")
    .addEventListener(
      "click",
      () => {

        const [y, m] =
          currentKey
            .split("-")
            .map(Number);


        if (
          isMonthLocked(
            y,
            m
          )
        ) {

          toast(
            "🔒 This month is locked and cannot be reconfigured.",
            "err"
          );

          return;
        }


        openSetup(true);

      }
    );


  // =========================================================
  // SAVE MONTH PLAN
  // =========================================================

  $("#setupForm")
    .addEventListener(
      "submit",
      e => {

        e.preventDefault();


        const selectedMonth =
          $("#setMonth").value;


        if (selectedMonth) {

          const [sy, sm] =
            selectedMonth
              .split("-")
              .map(Number);


          if (
            isMonthLocked(
              sy,
              sm
            )
          ) {

            toast(
              "🔒 This month is locked and cannot be modified.",
              "err"
            );

            closeSetup();

            return;
          }

        }


        const month =
          $("#setMonth").value;


        const w =
          +$("#setWorking").value;


        const o =
          +$("#setOffice").value;


        const h =
          +$("#setWfh").value;


        const l =
          +$("#setLeave").value;


        if (!month) {

          return toast(
            "Please pick a month",
            "err"
          );

        }


        if (w <= 0) {

          return toast(
            "Working days must be > 0",
            "err"
          );

        }


        currentKey =
          month;


        plan = {

          working: w,

          office: o,

          wfh: h,

          leave: l

        };


        localStorage.setItem(
          planKey(),
          JSON.stringify(plan)
        );


        if (
          !localStorage.getItem(
            attKey()
          )
        ) {

          att = {

            startedAt:
              new Date().toISOString(),

            days: {}

          };


          localStorage.setItem(
            attKey(),
            JSON.stringify(att)
          );

        } else {

          att =
            JSON.parse(
              localStorage.getItem(
                attKey()
              )
            );

        }


        closeSetup();


        render();

      }
    );


  // =========================================================
  // RENDER CALENDAR
  // =========================================================

  function render() {

    const [y, m] =
      currentKey
        .split("-")
        .map(Number);


    const isLocked =
      isMonthLocked(y, m);


    const first =
      new Date(
        y,
        m - 1,
        1
      );


    const lastDay =
      new Date(
        y,
        m,
        0
      ).getDate();


    const startWd =
      first.getDay();


    $("#calTitle").textContent =
      first.toLocaleDateString(
        undefined,
        {
          month: "long",
          year: "numeric"
        }
      );


    const existingLockMsg =
      document.getElementById(
        "monthLockMsg"
      );


    if (existingLockMsg) {
      existingLockMsg.remove();
    }


    if (isLocked) {

      const msg =
        document.createElement("p");


      msg.id =
        "monthLockMsg";


      msg.className =
        "muted";


      msg.textContent =
        "🔒 This month is locked. Attendance can only be edited until the 5th of the following month.";


      $("#calTitle")
        .parentElement
        .appendChild(msg);

    }


    const cal =
      $("#calendar");


    cal.innerHTML = "";


    // Empty cells before month

    for (
      let i = 0;
      i < startWd;
      i++
    ) {

      const d =
        document.createElement("div");


      d.className =
        "day empty";


      cal.appendChild(d);

    }


    const today =
      new Date();


    const todayK =
      dayKey(today);


    // Days

    for (
      let day = 1;
      day <= lastDay;
      day++
    ) {

      const date =
        new Date(
          y,
          m - 1,
          day
        );


      const k =
        dayKey(date);


      const wd =
        date.getDay();


      const isWeekend =
        wd === 0 ||
        wd === 6;


      // Get holiday from holiday.xlsx

      const holiday =
        holidayRegistry[k];


      const isMandatory =
        holiday &&
        holiday.type === "mandatory";


      const isOptional =
        holiday &&
        holiday.type === "optional";


      /*
        Mandatory holidays and weekends
        cannot be clicked.
      */

      const isNonWorking =
        isWeekend ||
        isMandatory;


      const cell =
        document.createElement("div");


      cell.className =
        "day";


      if (isLocked) {

        cell.classList.add(
          "locked"
        );

      }


      if (isWeekend) {

        cell.classList.add(
          "holiday"
        );

      }


      if (isMandatory) {

        cell.classList.add(
          "holiday",
          "mandatory"
        );

      }


      if (isOptional) {

        cell.classList.add(
          "optional-holiday"
        );

      }


      if (k === todayK) {

        cell.classList.add(
          "today"
        );

      }


      const v =
        att?.days?.[k];


      if (v) {

        cell.classList.add(v);

      }


      // Label

      let labelText = "";


      if (isMandatory) {

        labelText =
          holiday.name;

      } else if (isWeekend) {

        labelText =
          "Weekend";

      } else if (v) {

        labelText =
          capitalize(v);

      } else if (isOptional) {

        labelText =
          holiday.name;

      }


      // Optional badge

      const optBadge =
        isOptional
          ? `<span class="opt-badge">OPT</span>`
          : "";


      cell.innerHTML =
        `${optBadge}
         <span class="n">${day}</span>
         <span class="lbl">${labelText}</span>`;


      // Working day click

      if (
        !isNonWorking &&
        !isLocked
      ) {

        cell.addEventListener(
          "click",
          () => {

            const cur =
              att.days[k];


            if (!cur) {

              att.days[k] =
                "wfh";

            } else if (
              cur === "wfh"
            ) {

              att.days[k] =
                "present";

            } else if (
              cur === "present"
            ) {

              att.days[k] =
                "leave";

            } else if (
              cur === "leave"
            ) {

              delete att.days[k];

            }


            cell.classList.remove(
              "present",
              "wfh",
              "leave"
            );


            const value =
              att.days[k];


            if (value) {

              cell.classList.add(
                value
              );


              cell.querySelector(
                ".lbl"
              ).textContent =
                capitalize(value);


            } else {

              cell.querySelector(
                ".lbl"
              ).textContent =
                isOptional
                  ? holiday.name
                  : "";


            }


            localStorage.setItem(
              attKey(),
              JSON.stringify(att)
            );


            updateStats();

          }
        );

      }


      cal.appendChild(cell);

    }


    updateStats();

  }


  // =========================================================
  // STATISTICS
  // =========================================================

  function updateStats() {

    const c = {

      present: 0,

      wfh: 0,

      leave: 0

    };


    Object.values(
      att?.days || {}
    ).forEach(v => {

      if (
        c[v] !== undefined
      ) {

        c[v]++;

      }

    });


    const [y, m] =
      currentKey
        .split("-")
        .map(Number);


    /*
      Calculate working days directly
      from uploaded holiday Excel.
    */

    const w =
      getWorkingDays(
        y,
        m - 1
      );


    /*
      Keep plan synchronized with
      actual holiday calculation.
    */

    if (plan) {

      plan.working = w;

    }


    const effectiveDays =
      Math.max(
        0,
        w - c.leave
      );


    const attended =
      c.present +
      c.wfh;


    const pct =
      effectiveDays
        ? Math.round(
            (attended /
              effectiveDays) *
              100
          )
        : 0;


    const offPct =
      effectiveDays
        ? Math.round(
            (c.present /
              effectiveDays) *
              100
          )
        : 0;


    const wfhPct =
      effectiveDays
        ? Math.round(
            (c.wfh /
              effectiveDays) *
              100
          )
        : 0;


    const done =
      attended;


    const officeLeft =
      Math.max(
        0,
        (plan?.office || 0) -
        c.present
      );


    const wfhLeft =
      Math.max(
        0,
        (plan?.wfh || 0) -
        c.wfh
      );


    $("#kAtt").textContent =
      pct + "%";


    $("#mAtt").style.width =
      pct + "%";


    $("#kOff").textContent =
      offPct + "%";


    $("#mOff").style.width =
      offPct + "%";


    $("#kWfh").textContent =
      wfhPct + "%";


    $("#mWfh").style.width =
      wfhPct + "%";


    $("#kLeave").textContent =
      c.leave;


    $("#kDone").textContent =
      done;


    $("#kDoneSub").textContent =
      `of ${w} days`;


    $("#kRemain").textContent =
      `${officeLeft} WFO`;


    $("#kRemainSub").textContent =
      `${wfhLeft} WFH left`;

  }


  // =========================================================
  // MONTH KEY
  // =========================================================

  function monthKey(d) {

    return (
      d.getFullYear() +
      "-" +
      String(
        d.getMonth() + 1
      ).padStart(2, "0")
    );

  }


  // =========================================================
  // LOCKED MONTH
  // =========================================================

  function isMonthLocked(
    year,
    month
  ) {

    const lockDate =
      new Date(
        year,
        month,
        6,
        0,
        0,
        0
      );


    return (
      new Date() >=
      lockDate
    );

  }


  // =========================================================
  // DAY KEY
  // =========================================================

  function dayKey(d) {

    return (
      d.getFullYear() +
      "-" +
      String(
        d.getMonth() + 1
      ).padStart(2, "0") +
      "-" +
      String(
        d.getDate()
      ).padStart(2, "0")
    );

  }


  // =========================================================
  // WORKING DAYS
  // =========================================================

  function getWorkingDays(
    year,
    month
  ) {

    let total = 0;


    const lastDay =
      new Date(
        year,
        month + 1,
        0
      ).getDate();


    for (
      let day = 1;
      day <= lastDay;
      day++
    ) {

      const d =
        new Date(
          year,
          month,
          day
        );


      const weekDay =
        d.getDay();


      const k =
        dayKey(d);


      const holiday =
        holidayRegistry[k];


      const isMandatory =
        holiday &&
        holiday.type === "mandatory";


      /*
        Working day:

        Monday-Friday
        AND
        NOT mandatory holiday
      */

      if (
        weekDay !== 0 &&
        weekDay !== 6 &&
        !isMandatory
      ) {

        total++;

      }

    }


    return total;

  }


  // =========================================================
  // WORKING DAYS IN MONTH
  // =========================================================

  function workingDaysInMonth(d) {

    return getWorkingDays(
      d.getFullYear(),
      d.getMonth()
    );

  }


  // =========================================================
  // CAPITALIZE STATUS
  // =========================================================

  function capitalize(s) {

    if (s === "present")
      return "WFO";

    if (s === "wfh")
      return "WFH";

    if (s === "leave")
      return "Leave";

    return "";

  }


  // =========================================================
  // DATE FORMAT
  // =========================================================

  function formatShort(d) {

    return d.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short"
      }
    );

  }


  // =========================================================
  // PREVIOUS MONTH
  // =========================================================

  $("#prevMonth")
    .addEventListener(
      "click",
      () => {

        const [y, m] =
          currentKey
            .split("-")
            .map(Number);


        currentKey =
          monthKey(
            new Date(
              y,
              m - 2,
              1
            )
          );


        loadMonth();

      }
    );


  // =========================================================
  // NEXT MONTH
  // =========================================================

  $("#nextMonth")
    .addEventListener(
      "click",
      () => {

        const [y, m] =
          currentKey
            .split("-")
            .map(Number);


        currentKey =
          monthKey(
            new Date(
              y,
              m,
              1
            )
          );


        loadMonth();

      }
    );


  // =========================================================
  // EXPORT ATTENDANCE
  // =========================================================

  $("#exportExcel")
    .addEventListener(
      "click",
      exportAttendance
    );


  function exportAttendance() {

    const current =
      new Date(
        currentKey + "-01"
      );


    const counts = {

      present: 0,

      wfh: 0,

      leave: 0

    };


    Object.values(
      att?.days || {}
    ).forEach(status => {

      if (
        status === "present"
      ) {

        counts.present++;

      }


      if (
        status === "wfh"
      ) {

        counts.wfh++;

      }


      if (
        status === "leave"
      ) {

        counts.leave++;

      }

    });


    const [cy, cm] =
      currentKey
        .split("-")
        .map(Number);


    const working =
      getWorkingDays(
        cy,
        cm - 1
      );


    const attended =
      counts.present +
      counts.wfh;


    const attendance =
      working
        ? Math.round(
            attended /
            Math.max(
              working -
              counts.leave,
              1
            ) *
            100
          )
        : 0;


    const wfoPercentage =
      working
        ? Math.round(
            counts.present /
            Math.max(
              working -
              counts.leave,
              1
            ) *
            100
          )
        : 0;


    const rows = [];


    Object.keys(
      att.days || {}
    )
      .sort()
      .forEach(date => {

        rows.push({

          Date: date,

          Status:
            att.days[date] === "present"
              ? "WFO"
              : att.days[date].toUpperCase()

        });

      });


    rows.push({});


    rows.push({

      Metric:
        "Working Days",

      Value:
        working

    });


    rows.push({

      Metric:
        "Planned WFO",

      Value:
        plan?.office || 0

    });


    rows.push({

      Metric:
        "Planned WFH",

      Value:
        plan?.wfh || 0

    });


    rows.push({

      Metric:
        "WFO Completed",

      Value:
        counts.present

    });


    rows.push({

      Metric:
        "WFO Percentage",

      Value:
        wfoPercentage + "%"

    });


    rows.push({

      Metric:
        "WFH Completed",

      Value:
        counts.wfh

    });


    rows.push({

      Metric:
        "Leave Used",

      Value:
        counts.leave

    });


    rows.push({

      Metric:
        "Attendance %",

      Value:
        attendance + "%"

    });


    const ws =
      XLSX.utils.json_to_sheet(
        rows
      );


    const wb =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      wb,
      ws,
      current.toLocaleString(
        "default",
        {
          month: "long"
        }
      )
    );


    XLSX.writeFile(
      wb,
      `Attendance_${currentKey}.xlsx`
    );


  }


// =========================================================
// INITIAL LOAD
// =========================================================

loadHolidayExcel().then(() => {

  loadMonth();

  // Open setup only after holiday.xlsx has loaded
  if (!plan) {
    openSetup(false);
  }

});

})();