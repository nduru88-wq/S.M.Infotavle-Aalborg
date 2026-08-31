/*
  Autoskalering til Microsoft Teams.

  Aktiveres ved at bruge:
  https://nduru88-wq.github.io/S.M.Infoavle-Aalborg/?teams=1

  Den almindelige adresse uden ?teams=1 påvirkes ikke.
*/

(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var erTeamsVisning = params.get("teams") === "1";
  var erMobilVisning = params.get("mobil") === "1";

  if (!erTeamsVisning || erMobilVisning) {
    return;
  }

  document.documentElement.classList.add("teams-visning");
  document.body.classList.add("teams-visning");

  var resizeTimer = null;

  function beregnTeamsSkala() {
    /*
      Tavlen er optimeret omkring 1600 x 900.
      Vi skalerer ned, når Teams-fanen giver mindre plads.
      Minimum 68 %, maksimum 92 %, så teksten hverken bliver
      ekstremt lille eller for stor.
    */
    var breddeSkala = window.innerWidth / 1600;
    var hoejdeSkala = window.innerHeight / 900;

    var skala = Math.min(breddeSkala, hoejdeSkala, 0.92);
    skala = Math.max(skala, 0.68);

    document.documentElement.style.setProperty(
      "--teams-scale",
      skala.toFixed(3)
    );
  }

  function planlaegBeregning() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(beregnTeamsSkala, 80);
  }

  beregnTeamsSkala();

  window.addEventListener("resize", planlaegBeregning);
  window.addEventListener("orientationchange", planlaegBeregning);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", planlaegBeregning);
  }
})();
