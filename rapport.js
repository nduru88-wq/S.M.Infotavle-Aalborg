const API_URL =
  "https://script.google.com/macros/s/AKfycbySJ7n3fUmVg4dtVDKxhfYsIhh8S5REFfCeoT9F1H8g5fY0PSGBEtx4Y95vF_8Htxrh/exec";

document.addEventListener("DOMContentLoaded", function() {
  saetStandardDatoer();
  hentValg();
});

function $(id) {
  return document.getElementById(id);
}

function saetStandardDatoer() {
  const nu = new Date();
  const foersteDag = new Date(nu.getFullYear(), nu.getMonth(), 1);
  const sidsteDag = new Date(nu.getFullYear(), nu.getMonth() + 1, 0);

  $("fraDato").value = formatDato(foersteDag);
  $("tilDato").value = formatDato(sidsteDag);
}

function formatDato(dato) {
  return dato.getFullYear() + "-" +
    String(dato.getMonth() + 1).padStart(2, "0") + "-" +
    String(dato.getDate()).padStart(2, "0");
}

function jsonpKald(params, success, failure) {
  const callbackName = "rapportCallback_" + Date.now();
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

    if (failure) {
      failure({ message: "Kunne ikke kontakte serveren." });
    }
  };

  script.src = API_URL + "?" + new URLSearchParams(params).toString();
  document.body.appendChild(script);
}

function hentValg() {
  console.log("Starter hentValg");

  $("rapportStatus").textContent = "Henter valgmuligheder...";

  jsonpKald(
    {
      action: "rapportValg"
    },
    function(data) {

      console.log("SUCCESS:");
      console.log(data);

      fyldSelect("person", data.personer || []);
      fyldSelect("aktivitet", data.aktivitetstyper || []);

      $("rapportStatus").textContent = "";
    },
    function(err) {

      console.log("FEJL:");
      console.log(err);

      $("rapportStatus").textContent =
        err.message || "Kunne ikke hente valgmuligheder.";
    }
  );
}

function fyldSelect(id, vaerdier) {
  const select = $(id);

  select.innerHTML = "<option>Alle</option>";

  vaerdier.forEach(function(vaerdi) {
    const option = document.createElement("option");
    option.value = vaerdi;
    option.textContent = vaerdi;
    select.appendChild(option);
  });
}

function visRapport() {
  $("rapportStatus").textContent = "Henter data...";
  $("rapportResultat").innerHTML = "";

  jsonpKald(
    {
      action: "rapportData",
      person: $("person").value,
      aktivitet: $("aktivitet").value,
      fraDato: $("fraDato").value,
      tilDato: $("tilDato").value
    },
    function(data) {
      $("rapportStatus").textContent =
        "Antal fundne rækker: " + data.length;

      tegnTabel(data);
    },
    function(err) {
      $("rapportStatus").textContent =
        err.message || "Der opstod en fejl.";
    }
  );
}

function tegnTabel(data) {
  const resultat = $("rapportResultat");

  if (!data || data.length === 0) {
    resultat.innerHTML =
      '<div class="tom">Ingen data fundet</div>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>Dato</th>
          <th>Person</th>
          <th>Aktivitet</th>
          <th>Tidspunkt</th>
          <th>Varighed</th>
          <th>Gentagelse</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach(function(a) {
    html += `
      <tr>
        <td>${escapeHtml(a.dato)}</td>
        <td>${escapeHtml(a.person)}</td>
        <td>${escapeHtml(a.aktivitet)}</td>
        <td>${escapeHtml(a.tidspunkt)}</td>
        <td>${escapeHtml(a.varighed)}</td>
        <td>${escapeHtml(a.gentagelse)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  resultat.innerHTML = html;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
