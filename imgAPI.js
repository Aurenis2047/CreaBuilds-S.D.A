let catalogo = null;
// Cargar catálogo de ítems al iniciar
fetch('catalogo.json')
  .then(res => res.json())
  .then(data => {
    catalogo = data;
    console.log("Catálogo cargado:", catalogo);
    iniciarPagina();
  });

document.addEventListener("DOMContentLoaded", () => {
  // handler reutilizable que siempre usa event.currentTarget
  function handleTitleClick(event) {
    const currentTitle = event.currentTarget; // el h1 que recibió el click

    // crear input con valor actual
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentTitle.textContent;
    input.className = "titulo-editable";

    // reemplazar
    currentTitle.replaceWith(input);
    input.focus();
    input.select();

    // función que restaura el h1 y le vuelve a añadir el mismo listener
    function guardarTitulo() {
      const nuevoTitulo = document.createElement("h1");
      nuevoTitulo.id = "titulo-principal";
      nuevoTitulo.textContent = input.value || "Título sin nombre";
      nuevoTitulo.addEventListener("click", handleTitleClick); // vuelve a vincular exactamente la misma función

      input.replaceWith(nuevoTitulo);

      // opcional: persistir
      try { localStorage.setItem('tituloBuilds', nuevoTitulo.textContent); } catch(e) {}
    }
git
    // Guardar al perder foco o presionar Enter
    input.addEventListener('blur', guardarTitulo, { once: true });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') guardarTitulo();
    }, { once: true });
  }
  const titulo = document.getElementById("titulo-principal");
  if (titulo) {
    titulo.addEventListener("click", handleTitleClick);
    try {
      const saved = localStorage.getItem('tituloBuilds');
      if (saved) titulo.textContent = saved;
    } catch(e) {}
  }
});

function iniciarPagina() { 
  const contenedor = document.getElementById('contenedor-builds');
  contenedor.innerHTML = ''; 

  const clone = document.createElement('div');
    clone.className = 'slot';
    clone.dataset.slotType = 'secundaria';      
    clone.textContent = 'secundaria';      

  const buildDiv = document.createElement('div');
  buildDiv.className = 'build';
  // dentro de tu loop que crea cada build
    const marca = document.createElement('div');
    marca.className = 'marca-build';
    marca.textContent = 'Soldados del Alba';
    buildDiv.appendChild(marca);


  const slotsContainer = document.createElement('div');
  slotsContainer.className = 'slots';

  // slots base
  ["mochila", "cabeza", "capa", "principal", "pecho", "secundaria", "pocion", "pies", "comida"].forEach(slot => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.dataset.slotType = slot;      
    div.textContent = slot;           

    div.addEventListener('click',(e) => {
      e.stopPropagation();           
      mostrarSelector(div, slot, buildDiv);
    });
    slotsContainer.appendChild(div);
  });
  
  buildDiv.appendChild(slotsContainer);
  contenedor.appendChild(buildDiv);
}


function mostrarSelector(slotElement, tipoSlot, buildDiv) {
  // quitar selector existente
  const prev = document.querySelector('.selector');
  if (prev) prev.remove();

  const opciones = catalogo.slots[tipoSlot];
  if (!opciones || opciones.length === 0) return;

  // crear contenedor selector
  const selector = document.createElement('div');
  selector.className = 'selector';

  // input de búsqueda
  const search = document.createElement('input');
  search.className = 'search';
  search.placeholder = 'Buscar...';
  search.type = 'search';
  selector.appendChild(search);
  // grid scrollable
  const grid = document.createElement('div');
  grid.className = 'selector-grid';
  selector.appendChild(grid);

  function renderOpciones(list) {
    grid.innerHTML = ''; // limpiar
    list.forEach(opt => {
      const img = document.createElement('img');
      img.src = `https://render.albiononline.com/v1/item/${opt.api}.png?size=64`;
      img.alt = opt.label;
      img.title = opt.label;
      img.dataset.api = opt.api;
      img.dataset.label = opt.label;

      img.addEventListener('click', (e) => {
        e.stopPropagation();
        // poner la imagen en el slot
        slotElement.innerHTML = `<img src="${img.src}" alt="${opt.label}" title="${opt.label}">`;
        selector.remove();      
        if (tipoSlot === 'principal')
            adjustOffhandSlot(buildDiv);
      });

      grid.appendChild(img);
    });
  }
  renderOpciones(opciones);

  // search: filtrar por label (insensible a mayúsculas)
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      renderOpciones(opciones);
      return;
    }
    const filtrado = opciones.filter(o => o.label.toLowerCase().includes(q) || (o.api && o.api.toLowerCase().includes(q)));
    renderOpciones(filtrado);
  });

  document.body.appendChild(selector);

  // posicionar cerca del slot (ajusta si se sale de la pantalla)
  const rect = slotElement.getBoundingClientRect();
  const padding = 8;
  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;

  // evitar que se salga por la derecha de la ventana
  const selWidth = selector.offsetWidth || 320;
  if ((left + selWidth + padding) > (window.scrollX + window.innerWidth)) {
    left = Math.max(padding + window.scrollX, window.scrollX + window.innerWidth - selWidth - padding);
  }
  // evitar que se salga por abajo (si no cabe abajo, abrir arriba)
  const selHeight = selector.offsetHeight || 360;
  const maxHeight = window.scrollY + window.innerHeight - top - padding;
  if (selHeight > maxHeight) {
        selector.style.height = `${maxHeight}px`;
        selector.style.overflowY = 'auto'; // permite scrollear dentro del selector
    }else{ selector.style.top = `${top}px`; }

  selector.style.left = `${left}px`;
 

  // click fuera cierra el selector
  function onDocClick(e) {
    if (!selector.contains(e.target)) {
      selector.remove();
      document.removeEventListener('click', onDocClick);
    }
  }
  setTimeout(() => document.addEventListener('click', onDocClick), 0);
}
function isTwoHanded(apiName, tipoSlot) {
    console.log("Comprobando si es 2H:", apiName);
  if (!apiName) return false;
  try {
    if (catalogo && catalogo.slots && catalogo.slots.principal) {
      const found = catalogo.slots.principal.find(i => i.api === apiName);
      if (found && typeof found.doble !== 'undefined') {
         return !!found.doble;
      }
    }
  } catch (e) {
  }

  const s = apiName.toUpperCase();
  if (s.includes('2H') || s.includes('_2H_') || s.includes('2_H')) return true;

  return false;
}

// Cuando cambie la arma principal, llama a esto para ajustar la mano secundaria visualmente
function adjustOffhandSlot(buildDiv) {
  // encontrar imagen/slot de principal y offhand dentro de buildDiv
  const principalSlot = buildDiv.querySelector('.slot[data-slot-type="principal"]');
  const offhandSlot = buildDiv.querySelector('.slot[data-slot-type="secundaria"]');
  if (!principalSlot) return;

  // obtener api del principal (si img existe)
  const imgPrincipal = principalSlot.querySelector('img');
  const imgOffhand = offhandSlot.querySelector('img');
  const mainApi = imgPrincipal ? imgPrincipal.src : null;
  
  const twohand = isTwoHanded(mainApi, 'principal');

  if (twohand) {
    offhandSlot.classList.add('offhand', 'muted');
    if (imgPrincipal) {
      offhandSlot.innerHTML = ''; // limpiar
      const imgClone = document.createElement('img');
      imgClone.src = imgPrincipal.src;
      imgClone.alt = 'Offhand (2H)';
      imgClone.title = 'Two-handed — mano secundaria desactivada';
      imgClone.dataset.api = mainApi;
      offhandSlot.appendChild(imgClone);
    }
  } else {
        offhandSlot.classList.remove('offhand','muted','allow-click');
        if (imgOffhand.alt === 'Offhand (2H)') {
            offhandSlot.innerHTML = 'secundaria';
        }
    }
}
