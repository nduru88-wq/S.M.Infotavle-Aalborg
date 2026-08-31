const API_URL =
  "https://script.google.com/macros/s/AKfycbySJ7n3fUmVg4dtVDKxhfYsIhh8S5REFfCeoT9F1H8g5fY0PSGBEtx4Y95vF_8Htxrh/exec";


let valgtGentagelse = "ingen";
let AKTIVITET_ID = new URLSearchParams(window.location.search).get("id") || "";

/* Kalenderens viste måned */
let kalenderAar = 0;
let kalenderMaaned = 0;

function $(id) {
  return document.getElementById(id);
}

function val(id) {
  return $(id) ? $(id).value : "";
}

function setVal(id, value) {
  if ($(id)) $(id).value = value || "";
}

function checked(id) {
  return $(id) && $(id).checked;
}

function setChecked(id, value) {
  if ($(id)) $(id).checked = !!value;
}

function setHtml(id, html) {
  if ($(id)) $(id).innerHTML = html;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function erMobilOpret() {
  return window.matchMedia("(max-width: 600px)").matches;
}

function hentAdminToken() {
  if (erMobilOpret()) {
    return sessionStorage.getItem("sm_admin_token") || "";
  }
  return localStorage.getItem("sm_admin_token") || "";
}

function gemAdminToken(token) {
  if (erMobilOpret()) {
    sessionStorage.setItem("sm_admin_token", token);
  } else {
    localStorage.setItem("sm_admin_token", token);
  }
}

function fjernAdminToken() {
  if (erMobilOpret()) {
    sessionStorage.removeItem("sm_admin_token");
  } else {
    localStorage.removeItem("sm_admin_token");
  }
}

function apiKald(params) {
  const data = Object.assign({}, params);

  if (data.action !== "adminLogin") {
    data.token = hentAdminToken();
  }

  const url = API_URL + "?" + new URLSearchParams(data).toString();

  return fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && data.ok === false) {
        throw new Error(data.message || "Ukendt fejl");
      }
      return data;
    });
}

window.addEventListener("load", function() {
  initKalender();
  opdaterEfterAktivitet();

  const token = hentAdminToken();

  if (!token) {
    visLogin();
    return;
  }

  apiKald({ action: "adminCheck" })
    .then(function() {
      visOpret();

      if (AKTIVITET_ID) {
        indlaesAktivitetTilRedigering(AKTIVITET_ID);
      }
    })
    .catch(function() {
      fjernAdminToken();
      visLogin();
    });
});

window.addEventListener("resize", function() {
  opdaterEfterAktivitet();
});

/* Luk kalenderen ved klik udenfor eller Escape */
document.addEventListener("click", function(event) {
  const vaelger = document.querySelector(".dato-vaelger");
  if (vaelger && !vaelger.contains(event.target)) {
    lukKalender();
  }
});

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    lukKalender();
  }
});

function saetLoginVenter(erVenter) {
  const knap = $("loginKnap");

  if (knap) {
    knap.disabled = erVenter;
    knap.classList.toggle("venter-knap", erVenter);
    knap.textContent = erVenter ? "Logger ind..." : "Log ind";
  }

  // Ingen indlæsningsanimation under knappen.
  // Feltet bruges kun til fejlbeskeder.
  if (erVenter) {
    setHtml("loginStatus", "");
  }
}

function saetSendVenter(erVenter) {
  const knap = $("sendTilTavleKnap");

  if (!knap) return;

  knap.disabled = erVenter;
  knap.classList.toggle("venter-knap", erVenter);
  knap.textContent = erVenter
    ? (AKTIVITET_ID ? "Opdaterer tavlen..." : "Sender til tavle...")
    : (AKTIVITET_ID ? "Opdater aktivitet" : "Send til tavle");
}

let sendSuccesTimer = null;

function visSendtPaaKnap() {
  const knap = $("sendTilTavleKnap");
  if (!knap) return;

  if (sendSuccesTimer) {
    clearTimeout(sendSuccesTimer);
  }

  knap.disabled = true;
  knap.classList.remove("venter-knap");
  knap.classList.add("sendt-knap");
  knap.textContent = "Sendt";

  sendSuccesTimer = setTimeout(function() {
    knap.classList.remove("sendt-knap");
    knap.disabled = false;
    knap.textContent = AKTIVITET_ID ? "Opdater aktivitet" : "Send til tavle";
    sendSuccesTimer = null;
  }, 3000);
}

function logInd() {
  const kode = val("adgangskode");

  setHtml("loginStatus", "");

  if (!kode) {
    setHtml("loginStatus", "Skriv adgangskoden først");
    return;
  }

  saetLoginVenter(true);

  apiKald({
    action: "adminLogin",
    kode: kode
  })
    .then(function(data) {
      gemAdminToken(data.token);
      setVal("adgangskode", "");
      saetLoginVenter(false);
      visOpret();

      if (AKTIVITET_ID) {
        indlaesAktivitetTilRedigering(AKTIVITET_ID);
      }
    })
    .catch(function(err) {
      saetLoginVenter(false);
      setHtml("loginStatus", err.message || "Forkert kode");
    });
}

function visLogin() {
  if ($("loginBox")) $("loginBox").style.display = "flex";
  if ($("opretForm")) $("opretForm").style.display = "none";
}

function visOpret() {
  if ($("loginBox")) $("loginBox").style.display = "none";
  if ($("opretForm")) $("opretForm").style.display = "flex";
}

/* ---------- KALENDER ---------- */

function initKalender() {
  const iDag = nulstilTid(new Date());

  setVal("dato", formatDatoInput(iDag));
  kalenderAar = iDag.getFullYear();
  kalenderMaaned = iDag.getMonth();

  opdaterDatoKnap();
  tegnKalender();
}

function toggleKalender() {
  const popup = $("kalenderPopup");
  const knap = $("datoKnap");

  if (!popup || !knap) return;

  const skalVises = !popup.classList.contains("vis");

  popup.classList.toggle("vis", skalVises);
  knap.setAttribute("aria-expanded", skalVises ? "true" : "false");

  if (skalVises) {
    const valgtDato = lavDatoFraInput(val("dato"));

    if (erGyldigDato(valgtDato)) {
      kalenderAar = valgtDato.getFullYear();
      kalenderMaaned = valgtDato.getMonth();
    }

    tegnKalender();
  }
}

function lukKalender() {
  if ($("kalenderPopup")) {
    $("kalenderPopup").classList.remove("vis");
  }

  if ($("datoKnap")) {
    $("datoKnap").setAttribute("aria-expanded", "false");
  }
}

function skiftKalenderMaaned(retning) {
  kalenderMaaned += retning;

  if (kalenderMaaned < 0) {
    kalenderMaaned = 11;
    kalenderAar--;
  }

  if (kalenderMaaned > 11) {
    kalenderMaaned = 0;
    kalenderAar++;
  }

  tegnKalender();
}

function vaelgGenvejsDato(antalDageFrem) {
  const dato = nulstilTid(new Date());
  dato.setDate(dato.getDate() + antalDageFrem);
  vaelgKalenderDato(dato);
}

function vaelgKalenderDato(dato) {
  const renDato = nulstilTid(dato);

  setVal("dato", formatDatoInput(renDato));
  kalenderAar = renDato.getFullYear();
  kalenderMaaned = renDato.getMonth();

  opdaterDatoKnap();
  tegnKalender();
  lukKalender();
}

function tegnKalender() {
  const titel = $("kalenderMaanedTitel");
  const dageBox = $("kalenderDage");

  if (!titel || !dageBox) return;

  const maanedsNavne = [
    "januar", "februar", "marts", "april", "maj", "juni",
    "juli", "august", "september", "oktober", "november", "december"
  ];

  titel.textContent = maanedsNavne[kalenderMaaned] + " " + kalenderAar;
  dageBox.innerHTML = "";

  const foersteDag = new Date(kalenderAar, kalenderMaaned, 1);
  const antalDage = new Date(kalenderAar, kalenderMaaned + 1, 0).getDate();

  /* JavaScript: søndag=0. Kalenderen skal starte mandag. */
  const tommeFelter = (foersteDag.getDay() + 6) % 7;

  for (let i = 0; i < tommeFelter; i++) {
    const tom = document.createElement("div");
    tom.className = "kalender-tom";
    dageBox.appendChild(tom);
  }

  const iDag = formatDatoInput(nulstilTid(new Date()));
  const valgt = val("dato");

  for (let dag = 1; dag <= antalDage; dag++) {
    const dato = new Date(kalenderAar, kalenderMaaned, dag);
    const datoTekst = formatDatoInput(dato);

    const knap = document.createElement("button");
    knap.type = "button";
    knap.className = "kalender-dag";
    knap.textContent = dag;
    knap.setAttribute("aria-label", formatDatoLang(dato));

    if (datoTekst === iDag) {
      knap.classList.add("i-dag");
    }

    if (datoTekst === valgt) {
      knap.classList.add("valgt");
      knap.setAttribute("aria-current", "date");
    }

    knap.addEventListener("click", function() {
      vaelgKalenderDato(dato);
    });

    dageBox.appendChild(knap);
  }
}

function opdaterDatoKnap() {
  const dato = lavDatoFraInput(val("dato"));

  if ($("datoKnap") && erGyldigDato(dato)) {
    $("datoKnap").textContent = "📅  " + formatDatoLang(dato);
  }
}

function formatDatoInput(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function formatDatoLang(d) {
  const dage = [
    "søndag", "mandag", "tirsdag", "onsdag",
    "torsdag", "fredag", "lørdag"
  ];

  const maaneder = [
    "januar", "februar", "marts", "april", "maj", "juni",
    "juli", "august", "september", "oktober", "november", "december"
  ];

  const tekst =
    dage[d.getDay()] + " " +
    d.getDate() + ". " +
    maaneder[d.getMonth()] + " " +
    d.getFullYear();

  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

function lavDatoFraInput(input) {
  const dele = String(input || "").split("-");

  if (dele.length !== 3) {
    return new Date(NaN);
  }

  return new Date(+dele[0], +dele[1] - 1, +dele[2]);
}

function nulstilTid(dato) {
  return new Date(dato.getFullYear(), dato.getMonth(), dato.getDate());
}

function erGyldigDato(dato) {
  return dato instanceof Date && !Number.isNaN(dato.getTime());
}

/* Bruges fortsat ved redigering af en aktivitet */
function sikrDatoISelect(selectId, dato) {
  if (!dato) return;

  const datoObjekt = lavDatoFraInput(dato);

  if (!erGyldigDato(datoObjekt)) return;

  setVal(selectId, dato);
  kalenderAar = datoObjekt.getFullYear();
  kalenderMaaned = datoObjekt.getMonth();

  opdaterDatoKnap();
  tegnKalender();
}


function hentValgtAktivitet() {
  return (
    val("aktivitetInfo") ||
    val("aktivitetFravaer") ||
    val("aktivitetFast") ||
    val("aktivitet") ||
    ""
  );
}

function vaelgAktivitetFraGruppe(gruppe) {
  let valgt = "";

  if (gruppe === "info") valgt = val("aktivitetInfo");
  if (gruppe === "fravaer") valgt = val("aktivitetFravaer");
  if (gruppe === "fast") valgt = val("aktivitetFast");

  if (gruppe !== "info") setVal("aktivitetInfo", "");
  if (gruppe !== "fravaer") setVal("aktivitetFravaer", "");
  if (gruppe !== "fast") setVal("aktivitetFast", "");

  setVal("aktivitet", valgt);

  opdaterKategoriFarver();
  opdaterEfterAktivitet();
}

function opdaterKategoriFarver() {
  ["aktivitetInfo", "aktivitetFravaer", "aktivitetFast"].forEach(function(id) {
    const el = $(id);
    if (!el) return;

    el.classList.remove("valgtKategori");

    if (el.value) {
      el.classList.add("valgtKategori");
    }
  });
}

function saetAktivitetIGruppe(aktivitet) {
  setVal("aktivitetFravaer", "");
  setVal("aktivitetFast", "");
  setVal("aktivitetInfo", "");
  setVal("aktivitet", aktivitet || "");

  if (!aktivitet) return;

  const fravaer = ["Arbejder hjemme", "Ferie", "Fri", "Syg"];

  const fast = [
    "Aktivitets café",
    "Friday Minds",
    "Fællespause",
    "KREA",
    "Praktisk værksted",
    "Undervisning"
  ];

  if (fravaer.includes(aktivitet)) {
    setVal("aktivitetFravaer", aktivitet);
  } else if (fast.includes(aktivitet)) {
    setVal("aktivitetFast", aktivitet);
  } else {
    setVal("aktivitetInfo", aktivitet);
  }

  opdaterKategoriFarver();
}

function opdaterEfterAktivitet() {
  setVal("aktivitet", hentValgtAktivitet());

  const aktivitet = hentValgtAktivitet();
  const noteBox = $("noteBox");

  if (noteBox) {
    noteBox.style.display = skalViseNote(aktivitet) ? "block" : "none";
  }

  opdaterHeleDagenEfterAktivitet();
}

function skalViseNote(aktivitet) {
  return [
    "Info",
    "Aktivitets café",
    "Friday Minds",
    "Fællespause",
    "KREA",
    "Praktisk værksted",
    "Undervisning",
    "Besøg",
    "Fødselsdag",
    "Møde",
    "Møder senere",
    "Rundvisning",
    "Ude af huset",
    "Velkommen til",
    "Faglig sparring"
  ].includes(aktivitet);
}

function vaelgGentagelse(type) {
  const dagligt = $("gentagDagligt");
  const ugentligt = $("gentagUgentligt");

  valgtGentagelse = "ingen";

  if (type === "dagligt" && dagligt.checked) {
    ugentligt.checked = false;
    valgtGentagelse = "dagligt";
  }

  if (type === "ugentligt" && ugentligt.checked) {
    dagligt.checked = false;
    valgtGentagelse = "ugentligt";
  }
}

function saetGentagelse(gentagelse) {
  valgtGentagelse = gentagelse || "ingen";
  setChecked("gentagDagligt", valgtGentagelse === "dagligt");
  setChecked("gentagUgentligt", valgtGentagelse === "ugentligt");
}

function toggleHeleDagen() {
  const hele = checked("heleDagen");
  setDisabledMedOpacity("tidspunkt", hele);
  setDisabledMedOpacity("varighedTimer", hele);
setDisabledMedOpacity("varighedMinutter", hele);
}

function setDisabledMedOpacity(id, disabled) {
  const el = $(id);
  if (!el) return;

  el.disabled = !!disabled;
  el.style.opacity = disabled ? "0.45" : "1";
}

function opdaterHeleDagenEfterAktivitet() {
  const aktivitet = hentValgtAktivitet();

  const skalVaereHeldag =
    val("aktivitetFravaer") !== "" ||
    aktivitet === "Fødselsdag";

  setChecked("heleDagen", skalVaereHeldag);

  if ($("heleDagen")) {
    $("heleDagen").disabled = skalVaereHeldag;
  }

  setDisabledMedOpacity("tidspunkt", skalVaereHeldag);
  setDisabledMedOpacity("varighedTimer", skalVaereHeldag);
setDisabledMedOpacity("varighedMinutter", skalVaereHeldag);
}

function hentFormData() {
  const hele = checked("heleDagen");

  return {
    dato: val("dato"),
    person: val("person"),
    aktivitet: hentValgtAktivitet(),
    tidspunkt: hele ? "08:00" : val("tidspunkt"),
    varighed: hele ? "Hele dagen" : (
  Number(val("varighedTimer")) + Number(val("varighedMinutter")) / 60
),
    gentagelse: valgtGentagelse,
    note: val("note")
  };
}

function sendTilTavle() {
  const a = hentFormData();

  if (!a.aktivitet) {
    setHtml("status", "Vælg en aktivitet først");
    return;
  }

  // Fjern tidligere status. Under indlæsningen vises teksten kun på knappen.
  setHtml("status", "");
  saetSendVenter(true);

  const params = {
    action: AKTIVITET_ID ? "opdaterAktivitet" : "gemAktivitet",
    id: AKTIVITET_ID,
    dato: a.dato,
    person: a.person,
    aktivitet: a.aktivitet,
    tidspunkt: a.tidspunkt,
    varighed: a.varighed,
    gentagelse: a.gentagelse,
    note: a.note
  };

  apiKald(params)
    .then(function() {
      saetSendVenter(false);
      setHtml("status", "");
      visSendtPaaKnap();
    })
    .catch(function(err) {
      saetSendVenter(false);

      if (String(err.message || "").includes("Login er udløbet")) {
        fjernAdminToken();
        visLogin();
      }

      setHtml("status", "Fejl: " + err.message);
    });
}

function indlaesAktivitetTilRedigering(id) {
  if ($("indlaeserOverlay")) {
    $("indlaeserOverlay").classList.add("vis");
  }

  apiKald({
    action: "hentAktivitet",
    id: id
  })
    .then(function(a) {
      if (!a) return;

      $("opretTitel").textContent = "REDIGER AKTIVITET";
      if ($("sendTilTavleKnap")) {
        $("sendTilTavleKnap").textContent = "Opdater aktivitet";
      }

      sikrDatoISelect("dato", a.dato);
      setVal("person", a.person);
      saetAktivitetIGruppe(a.aktivitet);
      setVal("tidspunkt", a.tidspunkt);
      setChecked("heleDagen", a.varighed === "Hele dagen");

      if (a.varighed !== "Hele dagen") {
  const samletVarighed = Number(a.varighed || 1);
  const timer = Math.floor(samletVarighed);
  const minutter = Math.round((samletVarighed - timer) * 60);

  setVal("varighedTimer", timer);
  setVal("varighedMinutter", minutter);
}

      setVal("note", a.note || "");
      saetGentagelse(a.gentagelse || "ingen");

      toggleHeleDagen();
      opdaterEfterAktivitet();
      opdaterKategoriFarver();
    })
    .catch(function(err) {
      setHtml("status", "Fejl: " + err.message);
    })
    .finally(function() {
      if ($("indlaeserOverlay")) {
        $("indlaeserOverlay").classList.remove("vis");
      }
    });
}

function gaaDirekteTilTavle() {
  const erMobil = window.matchMedia("(max-width: 768px)").matches;
  const tavleBase = "https://nduru88-wq.github.io/S.M.Infoavle-Aalborg/index.html";

  window.location.href = erMobil
    ? tavleBase + "?mobil=1"
    : tavleBase;
}
