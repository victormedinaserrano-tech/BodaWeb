const WEDDING_DATE = '2028-03-31T17:30:00+02:00';
const fallingLayer = document.querySelector('.falling');
const photoUploadEndpoint = String(window.WEDDING_UPLOAD_ENDPOINT || '').trim();

try {
  if (photoUploadEndpoint) {
    window.localStorage.setItem('weddingUploadEndpoint', photoUploadEndpoint);
  }
} catch (error) {
  // Ignora navegadores con localStorage deshabilitado.
}

function formatUnit(value) {
  return String(value).padStart(2, '0');
}

function updateCountdown() {
  const countdown = document.getElementById('countdown');
  if (!countdown) {
    return;
  }

  const target = new Date(WEDDING_DATE).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdown.innerHTML = `
    <div class="countdown__item"><strong>${days}</strong><span>días</span></div>
    <div class="countdown__item"><strong>${formatUnit(hours)}</strong><span>horas</span></div>
    <div class="countdown__item"><strong>${formatUnit(minutes)}</strong><span>min</span></div>
    <div class="countdown__item"><strong>${formatUnit(seconds)}</strong><span>seg</span></div>
  `;
}

function seedFallingNature() {
  if (!fallingLayer) {
    return;
  }

  const itemCount = window.matchMedia('(max-width: 540px)').matches ? 18 : 30;

  for (let i = 0; i < itemCount; i += 1) {
    const item = document.createElement('span');
    const isBlossom = Math.random() < 0.62;
    const size = isBlossom ? 12 + Math.random() * 8 : 10 + Math.random() * 8;

    item.className = `fall-item ${isBlossom ? 'fall-item--blossom' : 'fall-item--leaf'}`;
    item.style.left = `${Math.random() * 100}%`;
    item.style.setProperty('--item-size', `${size.toFixed(2)}px`);
    item.style.setProperty('--item-opacity', `${(0.48 + Math.random() * 0.42).toFixed(2)}`);
    item.style.setProperty('--fall-duration', `${(8.4 + Math.random() * 8.6).toFixed(2)}s`);
    item.style.setProperty('--sway-duration', `${(3.5 + Math.random() * 3.8).toFixed(2)}s`);
    item.style.setProperty('--fall-delay', `${(-Math.random() * 18).toFixed(2)}s`);
    item.style.setProperty('--drift-start', `${(-28 + Math.random() * 56).toFixed(0)}px`);
    item.style.setProperty('--drift-end', `${(-40 + Math.random() * 80).toFixed(0)}px`);
    item.style.setProperty('--sway-distance', `${(8 + Math.random() * 24).toFixed(0)}px`);
    item.style.setProperty('--rot-start', `${(Math.random() * 360).toFixed(0)}deg`);
    item.style.setProperty('--rot-end', `${(220 + Math.random() * 520).toFixed(0)}deg`);

    fallingLayer.appendChild(item);
  }
}

function animateHandwritingText() {
  const introLines = document.querySelectorAll('.hero__intro-line');
  const introPhoto = document.querySelector('.hero__intro-photo');

  const charStep = 0.07;
  const photoDuration = 1.05;
  const blockGap = 0.28;
  const photoGap = 0.34;

  const getLineDuration = (text) => {
    const visibleLength = text.replace(/\s+/g, '').length;
    return Math.max(0.55, visibleLength * charStep + 0.22);
  };

  const lineDurations = Array.from(introLines, (line) => getLineDuration(line.textContent || ''));
  const lineStarts = [];
  let cursor = 0;

  for (let i = 0; i < introLines.length; i += 1) {
    lineStarts[i] = cursor;
    cursor += lineDurations[i] + blockGap;

    if (i === 0 && introPhoto) {
      introPhoto.style.setProperty('--photo-delay', `${cursor}s`);
      cursor += photoDuration + photoGap;
    }
  }

  introLines.forEach((line, lineIndex) => {
    line.style.setProperty('--line-start', `${lineStarts[lineIndex] || 0}s`);
    line.style.setProperty('--char-step', `${charStep}s`);
  });

  introLines.forEach((line, lineIndex) => {
    const text = line.textContent || '';
    line.textContent = '';
    line.setAttribute('aria-label', text);

    Array.from(text).forEach((character, charIndex) => {
      const charSpan = document.createElement('span');
      charSpan.className = 'hero__intro-char';
      charSpan.style.setProperty('--char-index', `${charIndex}`);
      charSpan.textContent = character === ' ' ? '\u00A0' : character;
      line.appendChild(charSpan);
    });
  });
}

function initStoryCarousel() {
  const track = document.querySelector('[data-story-track]');
  if (!track) {
    return;
  }

  const items = Array.from(track.querySelectorAll('.story-carousel__item'));
  if (items.length === 0) {
    return;
  }

  let activeIndex = 0;

  const applyState = () => {
    const total = items.length;

    items.forEach((item, index) => {
      item.classList.remove('is-active', 'is-prev', 'is-next', 'is-far-left', 'is-far-right', 'is-hidden');

      const offset = (index - activeIndex + total) % total;

      if (offset === 0) {
        item.classList.add('is-active');
      } else if (offset === 1) {
        item.classList.add('is-next');
      } else if (offset === total - 1) {
        item.classList.add('is-prev');
      } else if (offset === 2) {
        item.classList.add('is-far-right');
      } else if (offset === total - 2) {
        item.classList.add('is-far-left');
      } else {
        item.classList.add('is-hidden');
      }
    });
  };

  applyState();
  window.setInterval(() => {
    activeIndex = (activeIndex + 1) % items.length;
    applyState();
  }, 3200);
}

function initShuttleBusDirection() {
  const bus = document.querySelector('.shuttle-visual--compact .shuttle-visual__bus--floating');
  if (!bus) {
    return;
  }

  let isForward = true;

  const startPass = () => {
    bus.classList.remove('shuttle-visual__bus--forward', 'shuttle-visual__bus--reverse');
    bus.classList.add(isForward ? 'shuttle-visual__bus--forward' : 'shuttle-visual__bus--reverse');
    isForward = !isForward;
  };

  bus.addEventListener('animationend', (event) => {
    if (event.target !== bus || !String(event.animationName).startsWith('shuttle-bus-')) {
      return;
    }

    startPass();
  });

  startPass();
}

function initPhotoUploadForm() {
  const form = document.querySelector('[data-upload-form]');
  if (!form) {
    return;
  }

  const guestNameField = form.querySelector('[data-guest-name]');
  const gate = form.querySelector('[data-upload-gate]');
  const guestNameInput = form.querySelector('[data-upload-name-input]');
  const guestNameContinue = form.querySelector('[data-upload-name-continue]');
  const fileInput = form.querySelector('input[name="photos"]');
  const status = form.querySelector('[data-upload-status]');
  const summary = form.querySelector('[data-upload-summary]');
  const dropzoneTitle = form.querySelector('.share-dropzone__title');
  const dropzoneIcon = form.querySelector('.share-dropzone__icon');
  const preview = form.querySelector('[data-upload-preview]');
  const previewImage = form.querySelector('[data-upload-preview-image]');
  const submitButton = form.querySelector('[data-upload-button]');
  const dropzone = form.querySelector('.share-dropzone');

  let guestName = '';

  const setStatus = (message, kind) => {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.remove('is-error', 'is-success');
    if (kind) {
      status.classList.add(kind);
    }
  };

  const setDropzoneTitleVisible = (isVisible) => {
    if (!dropzoneTitle) {
      return;
    }

    dropzoneTitle.hidden = !isVisible;
  };

  const resetUploadFlow = () => {
    guestName = '';

    if (guestNameField) {
      guestNameField.value = '';
    }

    if (guestNameInput) {
      guestNameInput.value = '';
    }

    if (fileInput) {
      fileInput.value = '';
    }

    if (gate) {
      gate.hidden = true;
    }

    if (summary) {
      summary.textContent = 'Primero te pediremos tu nombre y después podrás elegir tus fotos.';
    }

    setDropzoneTitleVisible(true);
    clearPreview();
  };

  const clearPreview = () => {
    if (previewImage) {
      previewImage.src = '';
    }

    if (preview) {
      preview.hidden = true;
    }

    if (dropzoneIcon) {
      dropzoneIcon.hidden = false;
    }
  };

  const setPreviewFromFile = (file) => {
    if (!file || !previewImage || !preview) {
      clearPreview();
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      previewImage.src = typeof reader.result === 'string' ? reader.result : '';
      preview.hidden = false;
      if (dropzoneIcon) {
        dropzoneIcon.hidden = true;
      }
    });
    reader.readAsDataURL(file);
  };

  const updateSummary = () => {
    if (!summary || !fileInput || !fileInput.files || fileInput.files.length === 0) {
      if (summary) {
        summary.textContent = guestName
          ? 'Puedes elegir tus fotos cuando quieras.'
          : 'Primero te pediremos tu nombre y después podrás elegir tus fotos.';
      }

      setDropzoneTitleVisible(!guestName);
      clearPreview();
      return;
    }

    const files = Array.from(fileInput.files);
    const total = files.length;
    summary.textContent = total === 1
      ? '1 imagen seleccionada'
      : `${total} imágenes seleccionadas`;
    setDropzoneTitleVisible(false);
    setPreviewFromFile(files[0]);
  };

  const confirmGuestName = () => {
    const value = guestNameInput && guestNameInput.value ? guestNameInput.value.trim() : '';

    if (!value) {
      setStatus('Escribe tu nombre para continuar.', 'is-error');
      if (guestNameInput) {
        guestNameInput.focus();
      }
      return false;
    }

    guestName = value;
    if (guestNameField) {
      guestNameField.value = guestName;
    }

    if (gate) {
      gate.hidden = true;
    }

    setDropzoneTitleVisible(false);

    setStatus(`Perfecto, ${guestName}. Ahora elige tus fotos.`, null);

    if (dropzone) {
      dropzone.click();
    }

    return true;
  };

  if (fileInput) {
    fileInput.addEventListener('change', updateSummary);
  }

  setDropzoneTitleVisible(true);
  clearPreview();

  if (guestNameContinue) {
    guestNameContinue.addEventListener('click', () => {
      confirmGuestName();
    });
  }

  if (guestNameInput) {
    guestNameInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        confirmGuestName();
      }
    });
  }

  if (dropzone) {
    dropzone.addEventListener('click', (event) => {
      if (!guestName) {
        event.preventDefault();

        if (gate) {
          gate.hidden = false;
        }

        if (guestNameInput) {
          guestNameInput.focus();
        }
        return;
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentGuestName = (guestNameField && guestNameField.value ? guestNameField.value.trim() : guestName);
    const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];

    if (!currentGuestName) {
      setStatus('Pulsa la casilla para indicar tu nombre primero.', 'is-error');
      return;
    }

    if (!files.length) {
      setStatus('Selecciona una o varias fotos para continuar.', 'is-error');
      if (fileInput) {
        fileInput.focus();
      }
      return;
    }

    if (!photoUploadEndpoint) {
      setStatus('La subida de fotos se activara cuando configuremos la URL del servidor.', 'is-error');
      return;
    }

    const formData = new FormData();
    formData.append('guestName', currentGuestName);
    files.forEach((file) => formData.append('photos', file));

    if (submitButton) {
      submitButton.disabled = true;
    }

    setStatus('Subiendo fotos...', null);

    try {
      const response = await fetch(photoUploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'No se ha podido completar la subida.');
      }

      setStatus(`Fotos subidas correctamente para ${payload.guestName || currentGuestName}.`, 'is-success');
      window.setTimeout(() => {
        resetUploadFlow();
        setStatus('', null);
      }, 1400);
    } catch (error) {
      const isLocalEndpoint = photoUploadEndpoint.includes('localhost') || photoUploadEndpoint.includes('127.0.0.1');
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      const message = isNetworkError && isLocalEndpoint
        ? 'No se puede conectar con el servidor de fotos local. Inicia el backend y configura CLOUDINARY_URL.'
        : (error instanceof Error ? error.message : 'No se ha podido completar la subida.');
      setStatus(message, 'is-error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
}

function scrollToSection(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function attachPublicHandlers() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') {
        return;
      }

      event.preventDefault();
      scrollToSection(href);
    });
  });
}

function boot() {
  seedFallingNature();
  animateHandwritingText();
  initStoryCarousel();
  initShuttleBusDirection();
  initPhotoUploadForm();

  if (document.body.classList.contains('boda-page')) {
    window.setTimeout(() => {
      document.body.classList.add('intro-complete');
    }, 5800);
  }

  if (!document.getElementById('countdown')) {
    return;
  }

  if (document.body.classList.contains('boda-page')) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-visible');
      });
    });
  }

  attachPublicHandlers();
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

boot();
