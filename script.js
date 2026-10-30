(function () {
  "use strict";

  const $ = id => document.getElementById(id);

  /* =====================================
     ABRIR INVITACIÓN
  ===================================== */

  const portada = $("portada");
  const botonAbrir = $("abrir");
  const invitacion = $("invitacion");
  const audio = $("audio");
  const botonAudio = $("audioFlotante");
  const botonMusica = $("botonMusica");

  let abierta = false;

  async function intentarMusica() {
    if (!audio) return;

    try {
      audio.volume = 0.45;
      await audio.play();
    } catch (error) {
      console.info("La música requiere una acción del usuario o no está disponible.");
    }

    actualizarBotonesAudio();
  }

  function actualizarBotonesAudio() {
    const sonando = Boolean(audio && !audio.paused && !audio.ended);

    if (botonAudio) {
      botonAudio.innerHTML = sonando
        ? '<i class="fa-solid fa-volume-high"></i>'
        : '<i class="fa-solid fa-volume-xmark"></i>';
      botonAudio.setAttribute("aria-pressed", String(sonando));
    }

    if (botonMusica) {
      botonMusica.innerHTML = sonando
        ? '<i class="fa-solid fa-pause"></i> PAUSAR CANCIÓN'
        : '<i class="fa-solid fa-play"></i> REPRODUCIR CANCIÓN';
      botonMusica.setAttribute("aria-pressed", String(sonando));
    }
  }

  async function alternarMusica() {
    if (!audio) return;

    if (audio.paused) {
      await intentarMusica();
    } else {
      audio.pause();
    }

    actualizarBotonesAudio();
  }

  if (botonAbrir && portada && invitacion) {
    botonAbrir.addEventListener("click", async function () {
      if (abierta) return;

      abierta = true;
      botonAbrir.disabled = true;

      invitacion.hidden = false;
      document.body.classList.remove("locked");
      portada.classList.add("abriendo");

      if (botonAudio) botonAudio.hidden = false;

      intentarMusica();

      window.setTimeout(function () {
        portada.hidden = true;
        window.scrollTo({ top: 0, behavior: "auto" });

        iniciarAnimaciones();
        iniciarPetalos();
      }, 1150);
    });
  } else {
    console.error("No se encuentra el botón o la portada de la invitación.");
  }

  if (botonAudio) botonAudio.addEventListener("click", alternarMusica);
  if (botonMusica) botonMusica.addEventListener("click", alternarMusica);

  if (audio) {
    audio.addEventListener("play", actualizarBotonesAudio);
    audio.addEventListener("pause", actualizarBotonesAudio);
    audio.addEventListener("ended", actualizarBotonesAudio);
  }


  /* =====================================
     CUENTA REGRESIVA
  ===================================== */

  const fechaEvento = new Date("2026-12-05T18:00:00-06:00");

  function actualizarCuenta() {
    const ids = ["dias", "horas", "minutos", "segundos"];
    const elementos = ids.map($);

    if (elementos.some(el => !el)) return;

    const diferencia = fechaEvento.getTime() - Date.now();

    if (diferencia <= 0) {
      elementos.forEach(el => el.textContent = "00");
      const mensaje = $("mensajeCuenta");
      if (mensaje) mensaje.textContent = "¡Llegó el gran día de mis XV años!";
      return;
    }

    const total = Math.floor(diferencia / 1000);

    elementos[0].textContent = String(Math.floor(total / 86400)).padStart(2, "0");
    elementos[1].textContent = String(Math.floor((total % 86400) / 3600)).padStart(2, "0");
    elementos[2].textContent = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    elementos[3].textContent = String(total % 60).padStart(2, "0");
  }

  actualizarCuenta();
  window.setInterval(actualizarCuenta, 1000);


  /* =====================================
     CALENDARIO AUTOMÁTICO
  ===================================== */

  function generarCalendario() {
    const calendario = $("calendario");
    if (!calendario) return;

    calendario.replaceChildren();

    ["D", "L", "M", "M", "J", "V", "S"].forEach(nombre => {
      const celda = document.createElement("div");
      celda.className = "cal-dia-nombre";
      celda.textContent = nombre;
      calendario.appendChild(celda);
    });

    const anio = 2026;
    const mes = 11;
    const primerDia = new Date(anio, mes, 1).getDay();
    const numeroDias = new Date(anio, mes + 1, 0).getDate();
    const anterior = new Date(anio, mes, 0).getDate();

    for (let i = primerDia - 1; i >= 0; i--) {
      const celda = document.createElement("div");
      celda.className = "cal-dia muted";
      celda.textContent = anterior - i;
      calendario.appendChild(celda);
    }

    for (let dia = 1; dia <= numeroDias; dia++) {
      const celda = document.createElement("div");
      celda.className = "cal-dia";
      celda.textContent = dia;

      if (dia === 5) {
        celda.classList.add("activo");
        celda.setAttribute("aria-label", "5 de diciembre: día de los XV años");
      }

      calendario.appendChild(celda);
    }

    const totalCeldas = primerDia + numeroDias;
    const restantes = (7 - totalCeldas % 7) % 7;

    for (let dia = 1; dia <= restantes; dia++) {
      const celda = document.createElement("div");
      celda.className = "cal-dia muted";
      celda.textContent = dia;
      calendario.appendChild(celda);
    }
  }

  generarCalendario();


  /* =====================================
     CARRUSEL MANUAL Y AUTOMÁTICO
  ===================================== */

  const pista = $("pista");
  const ventana = $("ventana");
  const anterior = $("anterior");
  const siguiente = $("siguiente");
  const contenedorPuntos = $("puntos");
  const slides = Array.from(document.querySelectorAll(".carrusel-slide"));

  let indice = 0;
  let intervalo = null;
  let toqueX = 0;

  function mostrarSlide(n) {
    if (!pista || slides.length === 0) return;

    indice = (n + slides.length) % slides.length;
    pista.style.transform = "translateX(-" + (indice * 100) + "%)";

    if (contenedorPuntos) {
      contenedorPuntos.querySelectorAll(".punto").forEach((p, i) => {
        p.classList.toggle("activo", i === indice);
      });
    }
  }

  function detenerCarrusel() {
    if (intervalo !== null) {
      window.clearInterval(intervalo);
      intervalo = null;
    }
  }

  function iniciarCarrusel() {
    detenerCarrusel();

    if (slides.length <= 1 || document.hidden ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    intervalo = window.setInterval(() => mostrarSlide(indice + 1), 5000);
  }

  function cambiarSlide(n) {
    mostrarSlide(n);
    iniciarCarrusel();
  }

  if (pista && contenedorPuntos && slides.length > 0) {
    slides.forEach((slide, i) => {
      const punto = document.createElement("button");
      punto.type = "button";
      punto.className = "punto";
      punto.setAttribute("aria-label", "Mostrar fotografía " + (i + 1));
      punto.addEventListener("click", () => cambiarSlide(i));
      contenedorPuntos.appendChild(punto);
    });

    if (anterior) anterior.addEventListener("click", () => cambiarSlide(indice - 1));
    if (siguiente) siguiente.addEventListener("click", () => cambiarSlide(indice + 1));

    if (ventana) {
      ventana.addEventListener("touchstart", e => {
        toqueX = e.changedTouches[0].screenX;
      }, { passive: true });

      ventana.addEventListener("touchend", e => {
        const finalX = e.changedTouches[0].screenX;
        const diferencia = toqueX - finalX;
        if (Math.abs(diferencia) > 45) {
          cambiarSlide(indice + (diferencia > 0 ? 1 : -1));
        }
      }, { passive: true });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) detenerCarrusel();
      else iniciarCarrusel();
    });

    mostrarSlide(0);
    iniciarCarrusel();
  }


  /* =====================================
     ANIMACIONES AL DESPLAZARSE (MEJORADAS)
  ===================================== */

  function iniciarAnimaciones() {
    // 1. Mantenemos el fondo de las secciones visible
    document.querySelectorAll(".fade").forEach(s => s.classList.add("visible"));

    // 2. Seleccionamos todos los elementos internos que queremos que floten al aparecer
    const elementos = document.querySelectorAll(
      ".eyebrow, .titulo, .linea, .texto, .simbolo, .adorno, " +
      ".marco-foto, .contador-caja, #mensajeCuenta, .familia-nombres p, .firma, " +
      ".padrino, .carrusel, .momento, .aviso-rosa, .regalos-texto, .regalos-icono, " +
      ".cancion, .artista, .boton-musica, .formulario-confirmacion"
    );

    // Si el celular está en modo ahorro de energía/movimiento, mostramos todo normal
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elementos.forEach(el => el.classList.add("visible-suave"));
      return;
    }

    // Ocultamos los elementos temporalmente
    elementos.forEach(el => el.classList.add("oculto-suave"));

    // Creamos el "vigilante" que detecta cuando bajas por la pantalla
    const observador = new IntersectionObserver((entradas, obs) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible-suave");
          obs.unobserve(entrada.target); // Deja de observarlo una vez que ya apareció
        }
      });
    }, { 
      threshold: 0.1, 
      rootMargin: "0px 0px -40px 0px" // Activa la animación un poquito antes de llegar al borde
    });

    // Le decimos al vigilante que observe cada elemento
    elementos.forEach(el => observador.observe(el));
  }


  /* =====================================
     PÉTALOS DE ROSA
  ===================================== */

  let petalosIniciados = false;

  function iniciarPetalos() {
    if (petalosIniciados) return;
    petalosIniciados = true;

    window.setInterval(() => {
      if (document.hidden) return;
      if (document.querySelectorAll(".petalo").length >= 10) return;

      const petalo = document.createElement("span");
      petalo.className = "petalo";
      petalo.textContent = Math.random() > .5 ? "✿" : "❀";
      petalo.style.left = Math.random() * 100 + "vw";

      const duracion = 7 + Math.random() * 4;
      petalo.style.animationDuration = duracion + "s";
      petalo.style.fontSize = (10 + Math.random() * 12) + "px";

      document.body.appendChild(petalo);

      window.setTimeout(() => petalo.remove(), duracion * 1000);
    }, 1000);
  }


  /* =====================================
     CONFIRMACIÓN POR WHATSAPP (DINÁMICO)
  ===================================== */

  const NUMERO_WHATSAPP = "528112152906"; 
  
  const botonWhatsApp = $("confirmarWhatsApp");
  const inputNombre = $("nombreInvitado");
  const inputDedicatoria = $("dedicatoriaInvitado");

  if (botonWhatsApp) {
    botonWhatsApp.addEventListener("click", function (e) {
      e.preventDefault();

      // Obtenemos lo que el usuario escribió
      const nombre = inputNombre ? inputNombre.value.trim() : "";
      const dedicatoria = inputDedicatoria ? inputDedicatoria.value.trim() : "";

      // Validamos que al menos haya puesto su nombre
      if (!nombre) {
        alert("Por favor, escribe tu nombre para confirmar tu asistencia.");
        if (inputNombre) inputNombre.focus();
        return;
      }

      // Validamos que hayas configurado el número
      const valido = /^\d{10,15}$/.test(NUMERO_WHATSAPP);
      if (!valido) {
        alert("Configura el número de WhatsApp en NUMERO_WHATSAPP, al final del código JS.");
        return;
      }

      // Armamos el mensaje
      let mensaje = `¡Hola! Confirmo mi asistencia a los XV años de Ximena. 🌹\n\n`;
      mensaje += `*Nombre:* ${nombre}\n`;
      
      if (dedicatoria) {
        mensaje += `\n*Mensaje para Ximena:*\n"${dedicatoria}"`;
      }

      // Creamos el enlace y abrimos WhatsApp
      const url = "https://wa.me/" + NUMERO_WHATSAPP + "?text=" + encodeURIComponent(mensaje);
      window.open(url, "_blank");
    });
  }

  if (audio) actualizarBotonesAudio();

  console.log("Invitación de Ximena lista.");
})();
