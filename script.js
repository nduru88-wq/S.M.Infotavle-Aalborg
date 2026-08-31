var PERSONER = [
  "Anja",
  "Bettina",
  "Ditte",
  "Michael",
  "Peter",
  "Sanne",
  "Frederik",
  "Dennis",
  "Janni",
  "Pernille"
];

var DAGE = [
  "Søndag",
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag"
];

/* Fravær påvirker personale-billeder/status */
var FRAVAER = [
  "Arbejder hjemme",
  "Ferie",
  "Fri",
  "Syg"
];

/* Heldag vælger automatisk "Hele dagen" og skjuler tidsvalg */
var HELDAG_AKTIVITETER = [
  "Arbejder hjemme",
  "Ferie",
  "Fri",
  "Syg"
];

var PERSON_BILLEDER = {
  Anja: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/anja.jpg",
  Bettina: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/bettina.jpg",
  Ditte: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/ditte.jpg",
  Michael: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/michael.jpg",
  Peter: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/peter.jpg",
  Sanne: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/sanne.jpg",
  Frederik: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/frederik.jpg",
  Dennis: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/dennis.jpg",
  Janni: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/janni.jpg",
  Pernille: "https://raw.githubusercontent.com/nduru88-wq/InfotavleSM-Billeder/main/billeder/pernille.jpg"
};

var AKTIVITETS_INFO = {
  "Aktivitets café": { ikon: "☕", klasse: "cafe" },
  "Arbejder hjemme": { ikon: "🏠", klasse: "hjemme" },
  "Besøg": { ikon: "🤝", klasse: "besoeg" },
  "Faglig sparring": { ikon: "💬", klasse: "sparring" },
  "Ferie": { ikon: "🌴", klasse: "ferie" },
  "Friday Minds": { ikon: "🎉", klasse: "friday" },
  "Fri": { ikon: "☀️", klasse: "fri" },
  "Fællespause": { ikon: "☕", klasse: "pause" },
  "Fødselsdag": { ikon: "🎂", klasse: "foedselsdag" },
  "Møde": { ikon: "👥", klasse: "moede" },
  "KREA": { ikon: "🎨", klasse: "krea" },
  "Møder senere": { ikon: "⏰", klasse: "senere" },
  "Praktisk værksted": { ikon: "🔨", klasse: "praktik" },
  "Praktiks værksted": { ikon: "🔨", klasse: "praktik" },
  "Rundvisning": { ikon: "👋", klasse: "rundvisning" },
  "Syg": { ikon: "🤒", klasse: "syg" },
  "Ude af huset": { ikon: "🚗", klasse: "ude" },
  "Undervisning": { ikon: "📚", klasse: "undervisning" },
  "Velkommen til": { ikon: "👋", klasse: "velkommen" }
};

var mobilVisning =
  new URLSearchParams(window.location.search).get("mobil") === "1";

var mobilDagOffset = 0;
var mobilTouchStartX = null;
var mobilTouchStartY = null;
var mobilSkifterDag = false;

var isRendering = false;
var renderQueued = false;
var dagScrollTimere = [];

var ugeOffset = 0;
var aktiviteterGlobal = [];
var simuleretDato = null;
var simuleretTid = null;
var klikPaaUr = 0;
var valgtGentagelse = "ingen";
var rValgtGentagelse = "ingen";
var redigerAktivitetId = null;

var brugTegnedeBilleder = false;
var personaleKlik = 0;


/***** SMÅ HJÆLPEFUNKTIONER *****/

function hentAdminTokenFraBrowser() {
  // På mobil gemmes login i sessionStorage, mens desktop kan bruge localStorage.
  return sessionStorage.getItem("sm_admin_token") ||
         localStorage.getItem("sm_admin_token") ||
         "";
}

function fjernAdminTokenFraBrowser() {
  sessionStorage.removeItem("sm_admin_token");
  localStorage.removeItem("sm_admin_token");
}



function $(id) {
  return document.getElementById(id);
}

function val(id) {
  return $(id) ? $(id).value : "";
}

function setVal(id, value) {
  if ($(id)) {
    $(id).value = value || "";
  }
}

function checked(id) {
  return $(id) && $(id).checked;
}

function setChecked(id, value) {
  if ($(id)) {
    $(id).checked = !!value;
  }
}

function setText(id, text) {
  if ($(id)) {
    $(id).textContent = text;
  }
}

function setHtml(id, html) {
  if ($(id)) {
    $(id).innerHTML = html;
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function nulstilTid(d) {
  d.setHours(0, 0, 0, 0);
  return d;
}

function erFravaer(aktivitet) {
  return FRAVAER.indexOf(aktivitet) > -1;
}

function erHeldagAktivitet(aktivitet) {
  return HELDAG_AKTIVITETER.indexOf(aktivitet) > -1;
}

function setDisabledMedOpacity(id, disabled) {
  var el = $(id);

  if (!el) return;

  el.disabled = !!disabled;
  el.style.opacity = disabled ? "0.45" : "1";
}


/***** PERSONALEBILLEDER *****/

function personImg(person) {
  var billede = PERSON_BILLEDER[person] || "https://via.placeholder.com/150";

  if (brugTegnedeBilleder) {
    billede = billede.replace(".jpg", "A.jpg");
  }

  return billede;
}

function skiftPersonaleBilleder() {
  personaleKlik++;

  if (personaleKlik >= 3) {
    brugTegnedeBilleder = !brugTegnedeBilleder;
    personaleKlik = 0;
    visPersonale();
  }
}


/***** START *****/

window.addEventListener("load", function() {
  if (mobilVisning) {
    document.body.classList.add("mobil-visning");
    opsaetMobilSwipe();
  }

  startUr();

  if ($("week")) {
    visUge();
    visPersonale();
    startSlideshow();
    hentVejr();
    hentOgVisAktiviteter();

    setInterval(hentOgVisAktiviteter, 300000);
    setInterval(hentVejr, 5 * 60 * 1000);
  }

  if ($("dato")) {
    fyldDatoer("dato");
    opdaterEfterAktivitet();
    visOpret();

    if (typeof AKTIVITET_ID !== "undefined" && AKTIVITET_ID) {
      indlaesAktivitetTilRedigering(AKTIVITET_ID);
    }
  }
});


/***** LOGIN *****/

function logInd() {
  if (val("adgangskode") === OPRET_KODE) {
    sessionStorage.setItem("sm_opret_login", "ok");
    visOpret();
  } else {
    setHtml("loginStatus", "Forkert kode");
  }
}

function visOpret() {
  if ($("loginBox")) {
    $("loginBox").style.display = "none";
  }

  if ($("opretForm")) {
    $("opretForm").style.display = "flex";
  }
}


/***** DATO / TID *****/

function fyldDatoer(selectId) {
  var select = $(selectId);
  if (!select) return;

  select.innerHTML = "";

  var iDag = new Date();

  for (var i = 0; i < 120; i++) {
    var d = new Date(iDag);
    d.setDate(iDag.getDate() + i);

    var opt = document.createElement("option");
    opt.value = formatDatoInput(d);
    opt.textContent = formatDatoVisning(d);

    select.appendChild(opt);
  }
}

function sikrDatoISelect(selectId, dato) {
  var select = $(selectId);
  if (!select || !dato) return;

  var findes = false;

  for (var i = 0; i < select.options.length; i++) {
    if (select.options[i].value === dato) {
      findes = true;
      break;
    }
  }

  if (!findes) {
    var d = lavDatoFraInput(dato);
    var opt = document.createElement("option");

    opt.value = dato;
    opt.textContent = formatDatoVisning(d);

    select.insertBefore(opt, select.firstChild);
  }

  select.value = dato;
}

function formatDatoInput(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

function formatDatoVisning(d) {
  return DAGE[d.getDay()] + " " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
}

function formatKortDato(d) {
  return pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
}

function hentDagNavn(d) {
  return DAGE[d.getDay()];
}

function lavDatoFraInput(input) {
  var tekst = String(input || "");
  var dele = tekst.indexOf("-") > -1
    ? tekst.split("-")
    : tekst.split("/").reverse();

  return dele.length >= 3
    ? new Date(+dele[0], +dele[1] - 1, +dele[2])
    : new Date(tekst);
}

function hentAktuelDato() {
  return simuleretDato ? lavDatoFraInput(simuleretDato) : new Date();
}

function hentMandag() {
  var d = hentAktuelDato();
  var dag = d.getDay();

  d.setDate(d.getDate() + (dag === 0 ? -6 : 1 - dag) + ugeOffset * 7);

  return nulstilTid(d);
}

function hentUgeNummer(dato) {
  var d = new Date(Date.UTC(dato.getFullYear(), dato.getMonth(), dato.getDate()));
  var dayNum = d.getUTCDay() || 7;

  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function erSammeDato(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}


/***** AKTIVITET / NOTE *****/

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
  var valgt = "";

  if (gruppe === "info") {
    valgt = val("aktivitetInfo");
  }

  if (gruppe === "fravaer") {
    valgt = val("aktivitetFravaer");
  }

  if (gruppe === "fast") {
    valgt = val("aktivitetFast");
  }

  if (gruppe !== "info") {
    setVal("aktivitetInfo", "");
  }

  if (gruppe !== "fravaer") {
    setVal("aktivitetFravaer", "");
  }

  if (gruppe !== "fast") {
    setVal("aktivitetFast", "");
  }

  setVal("aktivitet", valgt);
  setVal("note", "");

  opdaterKategoriFarver();
  opdaterHeleDagenEfterAktivitet();
  opdaterEfterAktivitet();
}

function opdaterKategoriFarver() {
  ["aktivitetInfo", "aktivitetFravaer", "aktivitetFast"].forEach(function(id) {
    var el = $(id);

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

  if (FRAVAER.indexOf(aktivitet) > -1) {
    setVal("aktivitetFravaer", aktivitet);
    return;
  }

  if (
    aktivitet === "Aktivitets café" ||
    aktivitet === "Friday Minds" ||
    aktivitet === "Fællespause" ||
    aktivitet === "KREA" ||
    aktivitet === "Praktisk værksted" ||
    aktivitet === "Undervisning"
  ) {
    setVal("aktivitetFast", aktivitet);
    return;
  }

  setVal("aktivitetInfo", aktivitet);
}

function opdaterEfterAktivitet() {
  setVal("aktivitet", hentValgtAktivitet());
  opdaterHeleDagenEfterAktivitet();

  var noteBox = $("noteBox");
  var aktivitet = hentValgtAktivitet();

  if (!noteBox) return;

  noteBox.style.display = skalViseNote(aktivitet) ? "block" : "none";
}

function skalViseNote(aktivitet) {
  return aktivitet === "Aktivitets café" ||
    aktivitet === "Friday Minds" ||
    aktivitet === "Fællespause" ||
    aktivitet === "KREA" ||
    aktivitet === "Praktisk værksted" ||
    aktivitet === "Undervisning" ||
    aktivitet === "Besøg" ||
    aktivitet === "Fødselsdag" ||
    aktivitet === "Møde" ||
    aktivitet === "Møder senere" ||
    aktivitet === "Rundvisning" ||
    aktivitet === "Ude af huset" ||
    aktivitet === "Velkommen til";
}


/***** GENTAGELSE / HELE DAGEN *****/

function sætGentagelse(prefix, type) {
  var dagligtId = prefix ? prefix + "Dagligt" : "gentagDagligt";
  var ugentligtId = prefix ? prefix + "Ugentligt" : "gentagUgentligt";

  var dagligt = $(dagligtId);
  var ugentligt = $(ugentligtId);

  if (!dagligt || !ugentligt) return "ingen";

  var valgt = "ingen";

  if (type === "dagligt" && dagligt.checked) {
    ugentligt.checked = false;
    valgt = "dagligt";
  }

  if (type === "ugentligt" && ugentligt.checked) {
    dagligt.checked = false;
    valgt = "ugentligt";
  }

  return valgt;
}

function vaelgGentagelse(type) {
  valgtGentagelse = sætGentagelse("", type);
}

function rVaelgGentagelse(type) {
  rValgtGentagelse = sætGentagelse("r", type);
}

function saetGentagelse(gentagelse) {
  valgtGentagelse = gentagelse || "ingen";

  setChecked("gentagDagligt", valgtGentagelse === "dagligt");
  setChecked("gentagUgentligt", valgtGentagelse === "ugentligt");
}

function feltId(prefix, navn) {
  if (prefix === "r") {
    return "r" + navn;
  }

  return navn.charAt(0).toLowerCase() + navn.slice(1);
}

function styrHeleDagen(prefix) {
  var heleDagenId = feltId(prefix, "HeleDagen");
  var tidspunktId = feltId(prefix, "Tidspunkt");
  var varighedId = feltId(prefix, "Varighed");

  var hele = checked(heleDagenId);

  setDisabledMedOpacity(tidspunktId, hele);
  setDisabledMedOpacity(varighedId, hele);
}

function toggleHeleDagen() {
  styrHeleDagen("");
}

function rToggleHeleDagen() {
  styrHeleDagen("r");
}

function opdaterHeleDagen(prefix, aktivitet) {
  var heleDagenId = feltId(prefix, "HeleDagen");

  if (erHeldagAktivitet(aktivitet)) {
    setChecked(heleDagenId, true);
  }

  styrHeleDagen(prefix);
}

function opdaterHeleDagenEfterAktivitet() {
  var aktivitet = hentValgtAktivitet();

  var heleDagen = $("heleDagen");

  if (!heleDagen) return;

  var skalVaereHeldag =
    val("aktivitetFravaer") !== "" ||
    aktivitet === "Fødselsdag";

  heleDagen.checked = skalVaereHeldag;
  heleDagen.disabled = skalVaereHeldag;

  setDisabledMedOpacity("tidspunkt", skalVaereHeldag);
  setDisabledMedOpacity("varighed", skalVaereHeldag);
}

function rOpdaterHeleDagen() {
  opdaterHeleDagen("r", val("rAktivitet"));
}


/***** OPRET / REDIGER *****/

function hentFormData(prefix) {
  var erRediger = prefix === "r";

  var datoId = erRediger ? "rDato" : "dato";
  var personId = erRediger ? "rPerson" : "person";
  var aktivitetId = erRediger ? "rAktivitet" : "aktivitet";
  var tidspunktId = erRediger ? "rTidspunkt" : "tidspunkt";
  var varighedId = erRediger ? "rVarighed" : "varighed";
  var heleDagenId = erRediger ? "rHeleDagen" : "heleDagen";
  var noteId = erRediger ? "rNote" : "note";

  var hele = checked(heleDagenId);

  return {
    dato: val(datoId),
    person: val(personId),
    aktivitet: erRediger ? val(aktivitetId) : hentValgtAktivitet(),
    tidspunkt: hele ? "08:00" : val(tidspunktId),
    varighed: hele ? "Hele dagen" : val(varighedId),
    note: skalViseNote(erRediger ? val(aktivitetId) : hentValgtAktivitet()) ? val(noteId) : ""
  };
}

function sendTilTavle() {
  var a = hentFormData("");

  if (!a.aktivitet) {
    setHtml("status", "Vælg en aktivitet først");
    return;
  }

  setHtml("status", "Gemmer...");

  var runner = google.script.run
    .withSuccessHandler(function() {
      setHtml("status", AKTIVITET_ID ? "Aktiviteten er opdateret" : "Aktiviteten er gemt");
    })
    .withFailureHandler(function(err) {
      setHtml("status", "Fejl: " + err.message);
    });

  if (typeof AKTIVITET_ID !== "undefined" && AKTIVITET_ID) {
    runner.opdaterAktivitet(
      AKTIVITET_ID,
      a.dato,
      a.person,
      a.aktivitet,
      a.tidspunkt,
      a.varighed,
      valgtGentagelse,
      a.note
    );
  } else {
    runner.gemAktivitet(
      a.dato,
      a.person,
      a.aktivitet,
      a.tidspunkt,
      a.varighed,
      valgtGentagelse,
      a.note
    );
  }
}

function indlaesAktivitetTilRedigering(id) {
  if ($("indlaeserOverlay")) {
    $("indlaeserOverlay").classList.add("vis");
  }

  google.script.run
    .withSuccessHandler(function(a) {
      if (!a) {
        if ($("indlaeserOverlay")) {
          $("indlaeserOverlay").classList.remove("vis");
        }

        return;
      }

      setText("opretTitel", "REDIGER AKTIVITET");

      sikrDatoISelect("dato", a.dato);
      setVal("person", a.person);

      saetAktivitetIGruppe(a.aktivitet);

      setVal("tidspunkt", a.tidspunkt);
      setChecked("heleDagen", a.varighed === "Hele dagen");

      if (a.varighed !== "Hele dagen") {
        setVal("varighed", a.varighed);
      }

      setVal("note", a.note || "");

      toggleHeleDagen();
      saetGentagelse(a.gentagelse || "ingen");
      opdaterEfterAktivitet();
      opdaterKategoriFarver();

      if ($("indlaeserOverlay")) {
        $("indlaeserOverlay").classList.remove("vis");
      }
    })
    .withFailureHandler(function(err) {
      if ($("indlaeserOverlay")) {
        $("indlaeserOverlay").classList.remove("vis");
      }

      setHtml("status", "Fejl: " + err.message);
    })
    .hentAktivitet(id);
}

function visRedigerFelter(vis) {
  var modal = $("redigerModal");
  if (!modal) return;

  var felter = modal.querySelectorAll("label, select, input, textarea, button");

  felter.forEach(function(el) {
    el.style.visibility = vis ? "visible" : "hidden";
  });

  if ($("redigerTitel")) {
    $("redigerTitel").style.visibility = "visible";
  }

  if ($("rStatus")) {
    $("rStatus").style.visibility = "visible";
  }
}

function redigerAktivitet(id) {
  if (!id) {
    alert("Fejl: Aktiviteten har ikke noget id.");
    return;
  }

  redigerAktivitetId = id;
  rValgtGentagelse = "ingen";

  setText("redigerTitel", "Indlæser aktivitet...");
  setText("rStatus", "");

  visRedigerFelter(false);
  fyldDatoer("rDato");

  if ($("redigerModal")) {
    $("redigerModal").classList.add("vis");
  }

  google.script.run
    .withSuccessHandler(function(a) {
      if (!a) {
        setText("rStatus", "Aktivitet ikke fundet");
        setText("redigerTitel", "Rediger aktivitet");
        visRedigerFelter(true);
        return;
      }

      sikrDatoISelect("rDato", a.dato);

      setVal("rDato", a.dato);
      setVal("rPerson", a.person);
      setVal("rAktivitet", a.aktivitet);
      setVal("rTidspunkt", a.tidspunkt);
      setChecked("rHeleDagen", a.varighed === "Hele dagen");

      if (a.varighed !== "Hele dagen") {
        setVal("rVarighed", a.varighed);
      } else {
        setVal("rVarighed", "1");
      }

      setVal("rNote", a.note || "");

      rValgtGentagelse = a.gentagelse || "ingen";

      setChecked("rDagligt", rValgtGentagelse === "dagligt");
      setChecked("rUgentligt", rValgtGentagelse === "ugentligt");

      rToggleHeleDagen();
      rOpdaterHeleDagen();

      setText("rStatus", "");
      setText("redigerTitel", "Rediger aktivitet");

      visRedigerFelter(true);
    })
    .withFailureHandler(function(err) {
      setText("rStatus", "Fejl: " + err.message);
      setText("redigerTitel", "Rediger aktivitet");
      visRedigerFelter(true);
    })
    .hentAktivitet(id);
}

function gemRedigering() {
  if (!redigerAktivitetId) return;

  var a = hentFormData("r");

  setText("rStatus", "Gemmer...");

  google.script.run
    .withSuccessHandler(function() {
      setText("rStatus", "Gemt!");

      setTimeout(function() {
        lukRedigerModal();
        hentOgVisAktiviteter();
      }, 800);
    })
    .withFailureHandler(function(err) {
      setText("rStatus", "Fejl: " + err.message);
    })
    .opdaterAktivitet(
      redigerAktivitetId,
      a.dato,
      a.person,
      a.aktivitet,
      a.tidspunkt,
      a.varighed,
      rValgtGentagelse,
      a.note
    );
}

function lukRedigerModal() {
  if ($("redigerModal")) {
    $("redigerModal").classList.remove("vis");
  }

  redigerAktivitetId = null;
}


/***** MOBIL – SWIPE MELLEM DAGE *****/

function opsaetMobilSwipe() {
  document.addEventListener("touchstart", function(event) {
    if (!mobilVisning || !event.touches || event.touches.length !== 1) return;

    mobilTouchStartX = event.touches[0].clientX;
    mobilTouchStartY = event.touches[0].clientY;
  }, { passive: true });

  document.addEventListener("touchend", function(event) {
    if (
      !mobilVisning ||
      mobilTouchStartX === null ||
      mobilTouchStartY === null ||
      !event.changedTouches ||
      event.changedTouches.length !== 1
    ) return;

    var slutX = event.changedTouches[0].clientX;
    var slutY = event.changedTouches[0].clientY;
    var forskelX = slutX - mobilTouchStartX;
    var forskelY = slutY - mobilTouchStartY;

    mobilTouchStartX = null;
    mobilTouchStartY = null;

    if (Math.abs(forskelX) < 60 || Math.abs(forskelX) <= Math.abs(forskelY)) return;

    skiftMobilDag(forskelX < 0 ? 1 : -1);
  }, { passive: true });
}

function skiftMobilDag(retning) {
  if (!mobilVisning || mobilSkifterDag) return;

  var week = $("week");
  if (!week) return;

  mobilSkifterDag = true;
  week.classList.remove(
    "mobil-glid-ind-fra-venstre", "mobil-glid-ind-fra-hoejre",
    "mobil-glid-ud-venstre", "mobil-glid-ud-hoejre"
  );
  week.classList.add(retning > 0 ? "mobil-glid-ud-venstre" : "mobil-glid-ud-hoejre");

  setTimeout(function() {
    mobilDagOffset += retning;
    visUge();
    visPersonale();
    window.scrollTo({ top: 0, behavior: "auto" });

    week.classList.remove("mobil-glid-ud-venstre", "mobil-glid-ud-hoejre");
    week.classList.add(retning > 0 ? "mobil-glid-ind-fra-hoejre" : "mobil-glid-ind-fra-venstre");

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        week.classList.remove("mobil-glid-ind-fra-hoejre", "mobil-glid-ind-fra-venstre");
      });
    });

    setTimeout(function() { mobilSkifterDag = false; }, 300);
  }, 180);
}

/***** TAVLE *****/

function hentOgVisAktiviteter() {
  if (isRendering) {
    renderQueued = true;
    return;
  }

  isRendering = true;

  function behandlData(data) {
    aktiviteterGlobal = Array.isArray(data) ? data : [];

    requestAnimationFrame(function() {
      visUge();
      visPersonale();
      opdaterSidstOpdateret();

      isRendering = false;

      if (renderQueued) {
        renderQueued = false;
        setTimeout(hentOgVisAktiviteter, 50);
      }

      document.body.classList.remove("loading");
    });
  }

  function visFejl(err) {
    isRendering = false;
    document.body.classList.remove("loading");

    setHtml(
      "week",
      "<div class='day'><h2>Fejl</h2><div class='noevent'>Kunne ikke hente aktiviteter<br>" +
      (err && err.message ? err.message : "") +
      "</div></div>"
    );
  }

  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(behandlData)
      .withFailureHandler(visFejl)
      .hentAktiviteter();

    return;
  }

  hentAktiviteterJsonp(behandlData, visFejl);
}

function hentAktiviteterJsonp(success, failure) {
  var callbackName = "smCallback_" + Date.now();

  var script = document.createElement("script");

  var url =
  "https://script.google.com/macros/s/AKfycbySJ7n3fUmVg4dtVDKxhfYsIhh8S5REFfCeoT9F1H8g5fY0PSGBEtx4Y95vF_8Htxrh/exec" +
    "?action=hentAktiviteter" +
    "&callback=" + callbackName;

  window[callbackName] = function(data) {
    try {
      success(data);
    } finally {
      delete window[callbackName];
      script.remove();
    }
  };

  script.onerror = function() {
    delete window[callbackName];
    script.remove();
    failure({ message: "Kunne ikke hente data via JSONP" });
  };

  script.src = url;
  document.body.appendChild(script);
}

function visUge() {
  var week = $("week");
  if (!week) return;

  week.innerHTML = "";

  var start;
  var antalDage;

  if (mobilVisning) {
    start = nulstilTid(new Date(hentAktuelDato()));
    start.setDate(start.getDate() + mobilDagOffset);
    antalDage = 1;
    setText("ugeTitel", "← Swipe for andre dage →");
  } else {
    start = hentMandag();
    antalDage = 5;
    setText("ugeTitel", "SPECIALMINDS INFOTAVLE - Uge " + hentUgeNummer(start));
  }

  for (var i = 0; i < antalDage; i++) {
    var dato = new Date(start);
    dato.setDate(start.getDate() + i);

    var day = document.createElement("div");

    day.className = "day" + (erSammeDato(dato, hentAktuelDato()) ? " current-day" : "");
    day.innerHTML = "<h2>" + hentDagNavn(dato) + "<br><span>" + formatKortDato(dato) + "</span></h2>";

    var dagens = aktiviteterGlobal
      .filter(function(a) {
  return aktivitetSkalVisesPaaDato(a, dato);
})
      
      .sort(function(a, b) {

  function erFoedselsdag(x) {
    return String(x.aktivitet || x.type || x.kategori || "")
      .toLowerCase()
      .includes("fødselsdag");
  }

  var aErFoedselsdag = erFoedselsdag(a);
  var bErFoedselsdag = erFoedselsdag(b);

  if (aErFoedselsdag && !bErFoedselsdag) return -1;
  if (!aErFoedselsdag && bErFoedselsdag) return 1;

  var aErFravaer = erFravaer(a.aktivitet) || a.aktivitet === "Ude af huset";
  var bErFravaer = erFravaer(b.aktivitet) || b.aktivitet === "Ude af huset";

  if (aErFravaer && !bErFravaer) return 1;
  if (!aErFravaer && bErFravaer) return -1;

  return String(a.tidspunkt || "").localeCompare(String(b.tidspunkt || ""));
});
    
    /* Aktiviteterne ligger i deres egen beholder, så kun listen scroller. */
    var dagScroll = document.createElement("div");
    dagScroll.className = "day-scroll";

    if (!dagens.length) {
      var tom = document.createElement("div");
      tom.className = "noevent";
      tom.textContent = "Ingen aktiviteter";
      dagScroll.appendChild(tom);
    } else {
      dagens.forEach(function(a) {
        dagScroll.appendChild(lavEventElement(a));
      });
    }

    day.appendChild(dagScroll);
    week.appendChild(day);
  }

  visMiniNaesteUge();

  /* Start kun automatisk scroll, hvis indholdet faktisk er for højt. */
  requestAnimationFrame(function() {
    startAutomatiskDagScroll();
  });
}

function stopAutomatiskDagScroll() {
  dagScrollTimere.forEach(function(timer) {
    if (timer && typeof timer.stop === "function") {
      timer.stop();
    } else {
      clearTimeout(timer);
    }
  });

  dagScrollTimere = [];
}

function startAutomatiskDagScroll() {
  stopAutomatiskDagScroll();

  var felter = document.querySelectorAll(".day-scroll");

  felter.forEach(function(felt) {
    felt.scrollTop = 0;

    /* Ingen animation, hvis alle aktiviteter allerede kan ses. */
    if (felt.scrollHeight <= felt.clientHeight + 2) return;

    var topPause = 3000;
    var bundPause = 3000;
    var scrollVarighed = 7000;
    var animationId = null;
    var stoppet = false;

    function gemTimer(callback, ventetid) {
      var timer = setTimeout(function() {
        if (!stoppet) callback();
      }, ventetid);

      dagScrollTimere.push(timer);
    }

    function easeInOut(t) {
      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function scrollTil(slutPosition, varighed, faerdig) {
      var startPosition = felt.scrollTop;
      var afstand = slutPosition - startPosition;
      var startTid = null;

      function animer(tidspunkt) {
        if (stoppet || !felt.isConnected) return;

        if (startTid === null) startTid = tidspunkt;

        var forloebetTid = tidspunkt - startTid;
        var fremgang = Math.min(forloebetTid / varighed, 1);
        var bloedFremgang = easeInOut(fremgang);

        felt.scrollTop = startPosition + afstand * bloedFremgang;

        if (fremgang < 1) {
          animationId = requestAnimationFrame(animer);
        } else {
          felt.scrollTop = slutPosition;
          animationId = null;
          if (typeof faerdig === "function") faerdig();
        }
      }

      animationId = requestAnimationFrame(animer);
    }

    function scrollNed() {
      var maksScroll = felt.scrollHeight - felt.clientHeight;
      if (stoppet || !felt.isConnected || maksScroll <= 2) return;

      scrollTil(maksScroll, scrollVarighed, function() {
        gemTimer(scrollOp, bundPause);
      });
    }

    function scrollOp() {
      if (stoppet || !felt.isConnected) return;

      scrollTil(0, scrollVarighed, function() {
        gemTimer(scrollNed, topPause);
      });
    }

    dagScrollTimere.push({
      stop: function() {
        stoppet = true;
        if (animationId !== null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    });

    gemTimer(scrollNed, topPause);
  });
}

function lavEventElement(a) {
  var info = AKTIVITETS_INFO[a.aktivitet] || {
    ikon: " ",
    klasse: "standard"
  };

  var fravaer = erFravaer(a.aktivitet);
  var erFoedselsdag = erFoedselsdagsAktivitet(a.aktivitet);

  var div = document.createElement("div");

  div.className =
    "event " +
    info.klasse +
    (fravaer ? " event-fravaer" : "") +
    (erFoedselsdag ? " event-foedselsdag" : "");

  var titel = escapeHtml(lavEventTitel(a, fravaer));
  var tid = escapeHtml(lavEventTid(a, fravaer));
  var person = escapeHtml(a.person || "");
  var id = escapeHtml(a.id || "");

  var venstreIkon = erFoedselsdag ? "🎂" : (info.ikon || " ");

  var hoejreIndhold;

if (erFoedselsdag) {
  hoejreIndhold = "<div class='event-person-photo event-neutral-person'>👤</div>";
} else if (!a.person || a.person === "Ingen") {
  hoejreIndhold = "";
} else {
  hoejreIndhold =
    "<div class='event-person-photo'><img src='" + personImg(a.person) + "'></div>" +
    "<div class='event-person-label'>" + person + "</div>";
}

  div.innerHTML =
  "<div class='event-person-box'>" +
    hoejreIndhold +
  "</div>" +
  "<div class='event-main-content'>" +
    "<div class='event-title'>" + titel + (tid ? " - " + tid : "") + "</div>" +
    lavEventNote(a) +
  "</div>" +
  "<div class='event-activity-icon'>" + venstreIkon + "</div>" +
    
 "<div class='event-actions'>" +
  "<button class='delete-btn' onclick=\"event.stopPropagation(); sletAktivitetFraTavle('" + id + "', this)\">Slet</button>" +
  "<button class='edit-btn' onclick=\"event.stopPropagation(); aabnRedigerSide('" + id + "')\">Ret</button>" +
"</div>";

  div.addEventListener("click", function() {
    div.classList.toggle("vis-menu");
  });

  return div;
}

function erFoedselsdagsAktivitet(aktivitet) {
  return aktivitet === "Fødselsdag" || aktivitet === "🎂 Fødselsdag";
}

function lavEventTitel(a, fravaer) {
  if (erFoedselsdagsAktivitet(a.aktivitet)) {
    return "Fødselsdag";
  }

  return a.aktivitet || "";
}

function lavEventTid(a, fravaer) {
  return lavTidstekst(a);
}

function lavEventPerson(a, fravaer) {
  return "";
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function lavEventNote(a) {
  return a.note
    ? "<div class='event-note'>" + escapeHtml(a.note) + "</div>"
    : "";
}


/***** PERSONALE *****/

function visPersonale() {
  var staff = $("staff");
  if (!staff) return;

  staff.innerHTML = "";

  var valgtDato = hentAktuelDato();

  var raekke1 = PERSONER.slice(0, 5);
  var raekke2 = PERSONER.slice(5);

  function lavPersonElement(person) {
    var aktuelle = aktiviteterGlobal.filter(function(a) {
      return String(a.person).toLowerCase() === person.toLowerCase() &&
        aktivitetSkalVisesPaaDato(a, valgtDato);
    });

    var fravaer = aktuelle.find(function(a) {
      return erFravaer(a.aktivitet);
    });

    var aktivStatus = aktuelle.find(function(a) {
      return statusSkalVisesNu(a);
    });

    var label = "";
    var erRod = false;

    if (fravaer) {
      label = fravaer.aktivitet;

      if (label === "Arbejder hjemme") {
        label = "Arb. hjem";
      }

      erRod = true;
    } else if (aktivStatus) {
      label = aktivStatus.aktivitet;
      erRod = false;
    }

    var div = document.createElement("div");

    div.className =
      "person " +
      (erRod ? "person-red" : "person-green") +
      (label ? " away" : "");

    div.innerHTML =
      "<div class='person-img-wrap'>" +
        "<img src='" + personImg(person) + "'>" +
        "<div class='away-label'>" + escapeHtml(label) + "</div>" +
      "</div>" +
      "<div>" + escapeHtml(person) + "</div>";

    return div;
  }

  var raekke1Div = document.createElement("div");
  raekke1Div.className = "staff-row staff-row-top";

  var raekke2Div = document.createElement("div");
  raekke2Div.className = "staff-row staff-row-bottom";

  raekke1.forEach(function(person) {
    raekke1Div.appendChild(lavPersonElement(person));
  });

  raekke2.forEach(function(person) {
    raekke2Div.appendChild(lavPersonElement(person));
  });

  staff.appendChild(raekke1Div);
  staff.appendChild(raekke2Div);
}

function statusSkalVisesNu(a) {
  if (!a || !a.aktivitet) return false;

  if (a.aktivitet === "Møde" || a.aktivitet === "Ude af huset") {
    return tidspunktErNu(a);
  }

  if (a.aktivitet === "Møder senere") {
    return foerStartTidspunkt(a);
  }

  return false;
}

function tidspunktErNu(a) {
  if (!a.tidspunkt || a.varighed === "Hele dagen") return false;

  var nuMin = hentAktuelTidIMinutter();
  var startMin = tidTilMinutter(a.tidspunkt);
  var slutMin = startMin + Number(a.varighed) * 60;

  return nuMin >= startMin && nuMin < slutMin;
}

function foerStartTidspunkt(a) {
  if (!a.tidspunkt) return false;

  var nuMin = hentAktuelTidIMinutter();
  var startMin = tidTilMinutter(a.tidspunkt);

  return nuMin < startMin;
}

function hentAktuelTidIMinutter() {
  if (simuleretTid) {
    return tidTilMinutter(simuleretTid);
  }

  var nu = new Date();

  return nu.getHours() * 60 + nu.getMinutes();
}

function tidTilMinutter(tid) {
  var dele = String(tid || "00:00").replace(".", ":").split(":");

  return Number(dele[0]) * 60 + Number(dele[1] || 0);
}

function aktivitetPasserTilDato(a, dato) {
  if (!a || !a.dato) return false;

  var start = nulstilTid(lavDatoFraInput(a.dato));
  var test = nulstilTid(new Date(dato));

  if (isNaN(start.getTime()) || isNaN(test.getTime())) return false;

  var testDato = formatDatoInput(test);
  var gentagTil = String(a.gentagTil || "").trim();

  // Respekter en eventuel slutdato på gentagelsen.
  if (gentagTil && testDato > gentagTil) {
    return false;
  }

  // Respekter datoer der er slettet/udeladt fra en gentagelse.
  var udeladteDatoer = String(a.udeladDatoer || "")
    .split(",")
    .map(function(v) { return v.trim(); })
    .filter(Boolean);

  if (udeladteDatoer.indexOf(testDato) > -1) {
    return false;
  }

  var gentagelse = String(a.gentagelse || "ingen").toLowerCase();

  if (gentagelse === "dagligt") {
    return start <= test;
  }

  if (gentagelse === "ugentligt") {
    return start <= test && start.getDay() === test.getDay();
  }

  if (gentagelse === "14dage") {
    if (start > test || start.getDay() !== test.getDay()) return false;

    var forskelDage = Math.round((test.getTime() - start.getTime()) / 86400000);
    return forskelDage % 14 === 0;
  }

  return start.getTime() === test.getTime();
}

function aktivitetSkalVisesPaaDato(a, dato) {
  if (!aktivitetPasserTilDato(a, dato)) return false;

  // En særskilt/redigeret forekomst (Parent ID) erstatter grundaktiviteten
  // på netop den dato. Dermed vises den oprindelige gentagelse ikke også.
  if (!a.parentId && a.id) {
    var datoTekst = formatDatoInput(nulstilTid(new Date(dato)));

    var harSaerforekomst = aktiviteterGlobal.some(function(o) {
      if (!o || !o.parentId || !o.dato) return false;

      return String(o.parentId) === String(a.id) &&
        String(o.dato) === datoTekst;
    });

    if (harSaerforekomst) {
      return false;
    }
  }

  return true;
}

function skiftUge(retning) {
  ugeOffset += retning;

  visUge();
  visPersonale();
}

function sletAktivitetFraTavle(id, knap) {
  if (!id) {
    alert("Mangler ID på aktiviteten.");
    return;
  }

  if (!confirm("Vil du slette aktiviteten?")) return;

  var eventKort = knap && knap.closest ? knap.closest(".event") : null;

  if (eventKort) {
    eventKort.classList.add("afventer-sletning");

    var gammelOverlay = eventKort.querySelector(".afventer-sletning-overlay");
    if (gammelOverlay) gammelOverlay.remove();

    var overlay = document.createElement("div");
    overlay.className = "afventer-sletning-overlay";
    overlay.innerHTML =
      "<span class='afventer-sletning-spinner' aria-hidden='true'></span>" +
      "<span>Aktiviteten slettes...</span>";

    eventKort.appendChild(overlay);
  }

  function fjernSletteAnimation() {
    if (!eventKort) return;
    eventKort.classList.remove("afventer-sletning");
    var overlay = eventKort.querySelector(".afventer-sletning-overlay");
    if (overlay) overlay.remove();
  }

  var callbackName = "smSletCallback_" + Date.now();
  var script = document.createElement("script");

  var url =
    "https://script.google.com/macros/s/AKfycbySJ7n3fUmVg4dtVDKxhfYsIhh8S5REFfCeoT9F1H8g5fY0PSGBEtx4Y95vF_8Htxrh/exec" +
    "?action=sletAktivitet" +
    "&id=" + encodeURIComponent(id) +
    "&token=" + encodeURIComponent(hentAdminTokenFraBrowser()) +
    "&callback=" + callbackName;

  window[callbackName] = function(data) {
    try {
      if (data && data.ok === false) {
        fjernSletteAnimation();

        if (String(data.message || "").includes("Login er udløbet")) {
          fjernAdminTokenFraBrowser();
        }

        alert(data.message || "Kunne ikke slette aktiviteten.");
        return;
      }

      // Lad animationen stå, indtil tavlen bliver hentet igen.
      hentOgVisAktiviteter();
    } finally {
      delete window[callbackName];
      script.remove();
    }
  };

  script.onerror = function() {
    fjernSletteAnimation();
    alert("Kunne ikke kontakte Apps Script.");
    delete window[callbackName];
    script.remove();
  };

  script.src = url;
  document.body.appendChild(script);
}


/***** UR / SIMULERET TID *****/

function startUr() {
  opdaterUr();
  setInterval(opdaterUr, 1000);
}

function opdaterUr() {
  var tidEl = $("urTid");
  var ur = $("ur");

  if (!tidEl || !ur) return;

  var nu = new Date();

  setText("aktuelDato", lavDatoTekst(nu));

  if (simuleretTid) {
    tidEl.textContent = simuleretTid + " SIM";
    ur.classList.add("simuleret");

    var dele = simuleretTid.split(":");
    nu.setHours(Number(dele[0]), Number(dele[1] || 0), 0, 0);
  } else {
    ur.classList.remove("simuleret");
    tidEl.textContent = "kl. " + pad(nu.getHours()) + "." + pad(nu.getMinutes());
  }

  var timer = nu.getHours() % 12;
  var minutter = nu.getMinutes();

  var timeGrad = (timer * 30) + (minutter * 0.5);
  var minutGrad = minutter * 6;

  var t = $("timeViser");
  var m = $("minutViser");

  if (t) {
    t.style.transform = "rotate(" + timeGrad + "deg)";
  }

  if (m) {
    m.style.transform = "rotate(" + minutGrad + "deg)";
  }
}

function lavDatoTekst(dato) {
  var maaneder = [
    "januar",
    "februar",
    "marts",
    "april",
    "maj",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "december"
  ];

  return DAGE[dato.getDay()] +
    " d. " +
    dato.getDate() +
    ". " +
    maaneder[dato.getMonth()];
}

function trykPåUr() {
  klikPaaUr++;

  if (klikPaaUr >= 3) {
    klikPaaUr = 0;
    aabnSimModal();
  }

  setTimeout(function() {
    klikPaaUr = 0;
  }, 1200);
}

function aabnSimModal() {
  if (!$("simModal")) return;

  setVal("simDato", simuleretDato || formatDatoInput(new Date()));
  setVal("simTid", simuleretTid || "10:00");

  $("simModal").classList.add("vis");
}

function lukSimModal() {
  if ($("simModal")) {
    $("simModal").classList.remove("vis");
  }
}

function aktiverSimTid() {
  simuleretDato = val("simDato");
  simuleretTid = val("simTid");

  setText("simStatus", "Simuleret tid er aktiv");

  opdaterUr();
  visUge();
  visPersonale();
}

function deaktiverSimTid() {
  simuleretDato = null;
  simuleretTid = null;

  setText("simStatus", "Normal tid er aktiv");

  opdaterUr();
  visUge();
  visPersonale();
}

function opdaterSidstOpdateret() {
  var nu = new Date();

  setText(
    "sidstOpdateret",
    "Infotavlen er sidst opdateret " +
    pad(nu.getHours()) +
    ":" +
    pad(nu.getMinutes())
  );
}


/***** TIDSTEKST *****/

function lavTidstekst(a) {
  if (!a.tidspunkt) return "";
  if (a.varighed === "Hele dagen") return "";

  var start = String(a.tidspunkt).replace(".", ":");
  var slut = beregnSlutTid(start, a.varighed);

  return slut ? start + " - " + slut : start;
}

function beregnSlutTid(startTid, varighed) {
  var dele = String(startTid || "").split(":");

  if (dele.length < 2 || !varighed) return "";

  var ekstraMinutter = Number(varighed) * 60;

  if (isNaN(ekstraMinutter)) return "";

  var d = new Date();

  d.setHours(
    parseInt(dele[0], 10),
    parseInt(dele[1], 10) + ekstraMinutter,
    0,
    0
  );

  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}


/***** LINKS / REDIGERING *****/

function gaaTilTavle() {
  var url = new URL(window.location.href);

  url.searchParams.delete("side");
  url.searchParams.delete("id");

  window.open(url.toString(), "_blank");
}

function aabnRedigerSide(id) {
  alert("Åbner redigering for ID: " + id);

  if (!id) {
    alert("Mangler ID på aktiviteten.");
    return;
  }

  window.location.href = "opret.html?id=" + encodeURIComponent(id);
}


/***** SLIDESHOW *****/

var slideshowIndex = 0;
var slideshowBilleder = [];
var slideshowTimer = null;

var SLIDESHOW_API =
  "https://api.github.com/repos/nduru88-wq/S.M.Infoavle-Aalborg/contents/slideshow";

function startSlideshow() {
  hentSlideshowBillederFraGithub();

  setInterval(function() {
    hentSlideshowBillederFraGithub();
  }, 30 * 60 * 1000);
}

function hentSlideshowBillederFraGithub() {
  fetch(SLIDESHOW_API + "?t=" + Date.now(), { cache: "no-store" })
    .then(function(response) {
      if (!response.ok) throw new Error("GitHub svarede med status " + response.status);
      return response.json();
    })
    .then(function(files) {
      if (!Array.isArray(files)) return;

      slideshowBilleder = files
        .filter(function(file) {
          return file.type === "file" && /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
        })
        .map(function(file) {
          return file.download_url;
        });

      if (slideshowBilleder.length === 0) return;

      slideshowIndex = 0;
      visSlideshowBillede();

      if (slideshowTimer) clearInterval(slideshowTimer);
      slideshowTimer = setInterval(function() {
        slideshowIndex = (slideshowIndex + 1) % slideshowBilleder.length;
        visSlideshowBillede();
      }, 5000);
    })
    .catch(function(error) {
      console.log("Kunne ikke hente slideshow-billeder:", error);
    });
}

function visSlideshowBillede() {
  if (slideshowBilleder.length === 0) return;

  var url = slideshowBilleder[slideshowIndex];
  var counterTekst = (slideshowIndex + 1) + " / " + slideshowBilleder.length;

  var pcImg = $("slideshowImg");
  var mobilImg = $("mobilSlideshowImg");
  var pcCounter = $("slideshowCounter");
  var mobilCounter = $("mobilSlideshowCounter");

  if (pcImg) pcImg.src = url;
  if (mobilImg) mobilImg.src = url;
  if (pcCounter) pcCounter.textContent = counterTekst;
  if (mobilCounter) mobilCounter.textContent = counterTekst;
}

function aabnMobilSlideshow() {
  var overlay = $("mobilSlideshowOverlay");
  if (!overlay) return;

  if (slideshowBilleder.length > 0) {
    visSlideshowBillede();
  } else {
    hentSlideshowBillederFraGithub();
  }

  overlay.classList.add("vis");
  overlay.setAttribute("aria-hidden", "false");
}

function lukMobilSlideshow() {
  var overlay = $("mobilSlideshowOverlay");
  if (!overlay) return;

  overlay.classList.remove("vis");
  overlay.setAttribute("aria-hidden", "true");
}

/***** MINI NÆSTE UGE *****/

function visMiniNaesteUge() {
  var box = $("miniNaesteUge");
  if (!box) return;

  box.innerHTML = "";

  var start = hentMandagForOffset(ugeOffset + 1);

  for (var i = 0; i < 5; i++) {
    var dato = new Date(start);
    dato.setDate(start.getDate() + i);

    var dag = document.createElement("div");
    dag.className = "mini-day";

    dag.innerHTML =
      "<div class='mini-day-title'>" +
        hentDagNavn(dato) +
        "<br><span>" + formatKortDato(dato) + "</span>" +
      "</div>";

    var dagens = aktiviteterGlobal
      .filter(function(a) {
        return aktivitetSkalVisesPaaDato(a, dato);
      })
      .sort(function(a, b) {
        return String(a.tidspunkt).localeCompare(String(b.tidspunkt));
      });

    if (!dagens.length) {
      var tom = document.createElement("div");
      tom.className = "mini-noevent";
      tom.textContent = "Ingen";
      dag.appendChild(tom);
    } else {
      dagens.forEach(function(a) {
        dag.appendChild(lavMiniEventElement(a));
      });
    }

    box.appendChild(dag);
  }
}

function lavMiniEventElement(a) {
  var info = AKTIVITETS_INFO[a.aktivitet] || {
    ikon: " ",
    klasse: "standard"
  };

  var fravaer = erFravaer(a.aktivitet);

  var div = document.createElement("div");
  div.className = "mini-event " + info.klasse + (fravaer ? " mini-event-fravaer" : "");

  div.innerHTML =
    "<div class='mini-icon'>" + (info.ikon || " ") + "</div>" +
    "<div class='mini-content'>" +
      "<div class='mini-title'>" + escapeHtml(lavEventTitel(a, fravaer)) + "</div>" +
      "<div class='mini-time'>" + escapeHtml(lavEventTid(a, fravaer)) + "</div>" +
      lavMiniPerson(a, fravaer) +
    "</div>";

  return div;
}

function lavMiniPerson(a, fravaer) {
  if (a.aktivitet === "Velkommen til" && a.note) return "";
  if (fravaer) return "";

  return "<div class='mini-person'>" + escapeHtml(a.person) + "</div>";
}

function hentMandagForOffset(offset) {
  var d = hentAktuelDato();
  var dag = d.getDay();

  d.setDate(
    d.getDate() +
    (dag === 0 ? -6 : 1 - dag) +
    offset * 7
  );

  return nulstilTid(d);
}


/***** VEJR *****/

function hentVejr() {
  var url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=57.048" +
    "&longitude=9.9187" +
    "&current=temperature_2m,weather_code,wind_speed_10m,precipitation" +
    "&timezone=Europe%2FCopenhagen";

  fetch(url)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (!data || !data.current) return;

      var temp = Math.round(data.current.temperature_2m);
      var kode = data.current.weather_code;
      var vind = Math.round(data.current.wind_speed_10m);
      var nedbor = data.current.precipitation || 0;

      var vejr = fortolkVejr(kode, nedbor, vind);

      var ikon = document.querySelector(".vejr-ikon");
      var tempEl = document.querySelector(".vejr-temp");
      var tekstEl = document.querySelector(".vejr-tekst");

      if (ikon) {
        ikon.textContent = vejr.ikon;
      }

      if (tempEl) {
        tempEl.textContent = temp + "°";
      }

      if (tekstEl) {
        tekstEl.textContent = vejr.tekst + " · Vind " + vind + " m/s";
      }
    })
    .catch(function() {
      var tekstEl = document.querySelector(".vejr-tekst");

      if (tekstEl) {
        tekstEl.textContent = "Kunne ikke hente vejr";
      }
    });
}

function fortolkVejr(kode, nedbor, vind) {
  if (nedbor > 0.2) {
    return { ikon: "🌧️", tekst: "Regn" };
  }

  if (vind >= 12) {
    return { ikon: "💨", tekst: "Blæser" };
  }

  if (kode === 0) {
    return { ikon: "☀️", tekst: "Sol" };
  }

  if (kode === 1 || kode === 2) {
    return { ikon: "🌤️", tekst: "Let skyet" };
  }

  if (kode === 3) {
    return { ikon: "☁️", tekst: "Overskyet" };
  }

  if (kode >= 71 && kode <= 77) {
    return { ikon: "❄️", tekst: "Sne" };
  }

  if (kode >= 45 && kode <= 48) {
    return { ikon: "🌫️", tekst: "Tåge" };
  }

  if (kode >= 95) {
    return { ikon: "⛈️", tekst: "Torden" };
  }

  return { ikon: "🌤️", tekst: "Vejr" };
}
