const API_URL =
  "https://script.google.com/macros/s/AKfycbySJ7n3fUmVg4dtVDKxhfYsIhh8S5REFfCeoT9F1H8g5fY0PSGBEtx4Y95vF_8Htxrh/exec";

function $(id) {
  return document.getElementById(id);
}

function visStatus(tekst, erFejl) {
  const status = $("status");
  status.textContent = tekst;
  status.className = erFejl ? "fejl" : "ok";
}

function nulstilKnap() {
  const knap = $("gemKnap");
  knap.disabled = false;
  knap.textContent = "Gem fødselsdag";
}

function jsonpKald(params, success, failure) {
  const callbackName = "foedCallback_" + Date.now();
  const script = document.createElement("script");

  params.callback = callbackName;

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
    failure({ message: "Kunne ikke kontakte Apps Script." });
  };

  script.src = API_URL + "?" + new URLSearchParams(params).toString();
  document.body.appendChild(script);
}

function gemFoedselsdag() {
  const navn = $("navn").value.trim();
  const kortDato = $("kortDato").value.trim();
  const manuelDato = $("manuelDato").value;
  const knap = $("gemKnap");

  visStatus("", false);

  if (!navn) {
    visStatus("Du skal skrive et fornavn.", true);
    return;
  }

  if (!kortDato && !manuelDato) {
    visStatus("Du skal enten skrive dato som tal eller vælge dato manuelt.", true);
    return;
  }

  knap.disabled = true;
  knap.textContent = "Gemmer...";

  jsonpKald(
  {
    action: "gemBirthday",
    navn: navn,
    kortDato: kortDato,
    manuelDato: manuelDato
  },
    function(resultat) {
      if (resultat && resultat.ok === false) {
        visStatus(resultat.message || "Der skete en fejl.", true);
        nulstilKnap();
        return;
      }

      visStatus(resultat || "Fødselsdagen er gemt.", false);

      $("navn").value = "";
      $("kortDato").value = "";
      $("manuelDato").value = "";

      nulstilKnap();
    },
    function(err) {
      visStatus(err.message || "Der skete en fejl.", true);
      nulstilKnap();
    }
  );
}
