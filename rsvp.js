function initRsvpWizard() {
  const wizard = document.querySelector('[data-rsvp-wizard]');
  if (!wizard) {
    return;
  }

  const progress = wizard.querySelector('[data-wizard-progress]');
  const setupForm = wizard.querySelector('[data-setup-form]');
  const personForm = wizard.querySelector('[data-person-form]');
  const personTitle = wizard.querySelector('[data-person-title]');
  const donePanel = wizard.querySelector('[data-done-panel]');
  const status = wizard.querySelector('[data-rsvp-status]');
  const prevButton = wizard.querySelector('[data-person-prev]');
  const nextButton = wizard.querySelector('[data-person-next]');
  const questionProgress = wizard.querySelector('[data-question-progress]');
  const resultCard = wizard.querySelector('[data-result-state]');
  const resultIcon = wizard.querySelector('[data-result-icon]');
  const resultIconText = wizard.querySelector('[data-result-icon-text]');
  const resultSpinner = wizard.querySelector('[data-result-spinner]');
  const resultLink = wizard.querySelector('[data-result-link]');
  const resultTitle = wizard.querySelector('[data-result-title]');
  const resultMessage = wizard.querySelector('[data-result-message]');

  const personNameInput = personForm ? personForm.querySelector('input[name="name"]') : null;
  const personAgeInput = personForm ? personForm.querySelector('input[name="age"]') : null;
  const allergiesInput = personForm ? personForm.querySelector('textarea[name="allergies"]') : null;
  const messageInput = personForm ? personForm.querySelector('textarea[name="message"]') : null;
  const busStep = personForm ? personForm.querySelector('[data-step="bus"]') : null;
  const childMenuStep = personForm ? personForm.querySelector('[data-step="childMenu"]') : null;
  const menuStep = personForm ? personForm.querySelector('[data-step="menu"]') : null;
  const allergiesStep = personForm ? personForm.querySelector('[data-step="allergies"]') : null;
  const personSteps = personForm ? Array.from(personForm.querySelectorAll('.rsvp-step')) : [];

  let primaryName = '';
  let companions = 0;
  let totalPeople = 0;
  let currentPersonIndex = 0;
  let currentQuestionIndex = 0;
  let peopleData = [];
  const queryUploadEndpoint = new URLSearchParams(window.location.search).get('uploadEndpoint') || '';
  let persistedUploadEndpoint = '';
  try {
    persistedUploadEndpoint = window.localStorage.getItem('weddingUploadEndpoint') || '';
  } catch (error) {
    persistedUploadEndpoint = '';
  }
  const uploadEndpoint = String(window.WEDDING_UPLOAD_ENDPOINT || queryUploadEndpoint || persistedUploadEndpoint || '').trim();
  let derivedRsvpEndpoint = '';

  if (uploadEndpoint.endsWith('/api/photos')) {
    derivedRsvpEndpoint = `${uploadEndpoint.slice(0, -'/api/photos'.length)}/api/rsvp`;
  } else if (uploadEndpoint.endsWith('/photos')) {
    derivedRsvpEndpoint = `${uploadEndpoint.slice(0, -'/photos'.length)}/rsvp`;
  }

  const RSVP_ENDPOINT = String(window.WEDDING_RSVP_ENDPOINT || derivedRsvpEndpoint || '').trim();

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

  const showDoneResult = (kind) => {
    if (!donePanel || !resultCard || !resultIcon || !resultTitle || !resultMessage || !personForm) {
      return;
    }

    personForm.hidden = true;
    donePanel.hidden = false;
    resultCard.setAttribute('data-result-state', kind);

    if (resultSpinner) {
      resultSpinner.hidden = kind !== 'loading';
    }
    if (resultIconText) {
      resultIconText.hidden = kind === 'loading';
    }
    if (resultLink) {
      resultLink.hidden = kind === 'loading';
    }

    if (kind === 'loading') {
      resultTitle.textContent = 'Espere, se están cargando sus datos';
      resultMessage.textContent = 'Estamos guardando vuestra confirmación. No cierres esta ventana.';
      if (progress) {
        progress.textContent = 'Paso 2 de 2 · Enviando';
      }
      return;
    }

    if (kind === 'error') {
      if (resultIconText) {
        resultIconText.textContent = '!';
      }
      resultTitle.textContent = 'No se pudo completar la confirmación';
      resultMessage.textContent = 'Ha surgido un error. Por favor, ponte en contacto con los novios para confirmar tu asistencia.';
      if (progress) {
        progress.textContent = 'Paso 2 de 2 · Error';
      }
      return;
    }

    if (resultIconText) {
      resultIconText.textContent = '✓';
    }
    resultTitle.textContent = 'Confirmación enviada';
    resultMessage.textContent = 'Tu respuesta se ha registrado correctamente. Gracias por confirmar.';
    if (progress) {
      progress.textContent = 'Paso 2 de 2 · Confirmación completa';
    }
  };

  const submitGroupToServer = async () => {
    if (!RSVP_ENDPOINT) {
      throw new Error('La confirmación estará disponible cuando configuremos Google Forms o el endpoint RSVP.');
    }

    const payload = {
      groupName: primaryName,
      responses: peopleData,
    };

    let response;
    try {
      response = await fetch(RSVP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const isHttpsPage = window.location.protocol === 'https:';
      const isHttpEndpoint = RSVP_ENDPOINT.toLowerCase().startsWith('http://');
      const isLocalEndpoint = RSVP_ENDPOINT.toLowerCase().includes('localhost') || RSVP_ENDPOINT.toLowerCase().includes('127.0.0.1');

      if (isHttpsPage && isHttpEndpoint && isLocalEndpoint) {
        throw new Error('Bloqueo del navegador: no se puede llamar a http://localhost desde una pagina https. Abre la web en localhost para probar o usa una URL https publica del backend.');
      }

      throw new Error('No se pudo conectar con el servidor RSVP. Revisa endpoint y CORS.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const hasBackendMessage = data && typeof data.error === 'string' && data.error.trim();
      let message = hasBackendMessage
        ? data.error
        : `No se pudo guardar la confirmación (HTTP ${response.status}).`;

      if (response.status === 403) {
        message = `Acceso denegado (HTTP 403) en ${RSVP_ENDPOINT}. Revisa que el endpoint apunte al backend y no al bucket estático.`;
      }

      throw new Error(message);
    }

    return data;
  };

  const getCheckedValue = (form, fieldName) => {
    const checked = form.querySelector(`input[name="${fieldName}"]:checked`);
    return checked ? checked.value : '';
  };

  const setCheckedValue = (form, fieldName, value) => {
    const target = form.querySelector(`input[name="${fieldName}"][value="${value}"]`);
    if (target) {
      target.checked = true;
    }
  };

  const clearChoice = (form, fieldName) => {
    const options = form.querySelectorAll(`input[name="${fieldName}"]`);
    options.forEach((option) => {
      option.checked = false;
    });
  };

  const parseAgeValue = () => {
    if (!personAgeInput) {
      return NaN;
    }

    const raw = String(personAgeInput.value || '').trim();
    if (!raw) {
      return NaN;
    }

    return Number(raw);
  };

  const getVisibleSteps = () => personSteps.filter((step) => !step.hidden);

  const updateChildMenuVisibility = () => {
    if (!childMenuStep || !personAgeInput || !personForm) {
      return;
    }

    if (getCheckedValue(personForm, 'attendance') === 'no') {
      childMenuStep.hidden = true;
      if (menuStep) {
        menuStep.hidden = true;
      }
      clearChoice(personForm, 'childMenu');
      clearChoice(personForm, 'menu');
      return;
    }

    const age = parseAgeValue();
    const isChild = Number.isFinite(age) && age >= 0 && age < 10;

    childMenuStep.hidden = !isChild;

    if (!isChild) {
      clearChoice(personForm, 'childMenu');
      if (menuStep) {
        menuStep.hidden = false;
      }
      return;
    }

    const wantsChildMenu = getCheckedValue(personForm, 'childMenu') === 'si';
    if (menuStep) {
      menuStep.hidden = wantsChildMenu;
      if (wantsChildMenu) {
        clearChoice(personForm, 'menu');
      }
    }
  };

  const updateFlowByAttendance = () => {
    if (!personForm) {
      return;
    }

    const attendance = getCheckedValue(personForm, 'attendance');
    const isNotAttending = attendance === 'no';

    if (busStep) {
      busStep.hidden = isNotAttending;
    }

    if (allergiesStep) {
      allergiesStep.hidden = isNotAttending;
    }

    if (isNotAttending) {
      clearChoice(personForm, 'bus');
      clearChoice(personForm, 'childMenu');
      clearChoice(personForm, 'menu');
      if (childMenuStep) {
        childMenuStep.hidden = true;
      }
      if (menuStep) {
        menuStep.hidden = true;
      }
      if (allergiesInput) {
        allergiesInput.value = '';
      }
      return;
    }

    if (busStep) {
      busStep.hidden = false;
    }

    if (allergiesStep) {
      allergiesStep.hidden = false;
    }

    updateChildMenuVisibility();
  };

  const showCurrentQuestion = () => {
    if (!personForm || !prevButton || !nextButton) {
      return;
    }

    const visibleSteps = getVisibleSteps();
    if (!visibleSteps.length) {
      return;
    }

    if (currentQuestionIndex > visibleSteps.length - 1) {
      currentQuestionIndex = visibleSteps.length - 1;
    }

    personSteps.forEach((step) => {
      step.classList.remove('is-active');
    });

    const activeStep = visibleSteps[currentQuestionIndex];
    if (activeStep) {
      activeStep.classList.add('is-active');
    }

    prevButton.hidden = currentQuestionIndex === 0;

    const isLastQuestion = currentQuestionIndex === visibleSteps.length - 1;
    const isLastPerson = currentPersonIndex === totalPeople - 1;
    nextButton.textContent = isLastQuestion
      ? (isLastPerson ? 'Completar grupo' : 'Siguiente persona')
      : 'Siguiente pregunta';

    if (progress) {
      progress.textContent = `Paso 2 de 2 · Persona ${currentPersonIndex + 1} de ${totalPeople}`;
    }

    if (questionProgress) {
      questionProgress.textContent = `Pregunta ${currentQuestionIndex + 1} de ${visibleSteps.length}`;
    }
  };

  const validateCurrentQuestion = () => {
    if (!personForm) {
      return false;
    }

    const visibleSteps = getVisibleSteps();
    const activeStep = visibleSteps[currentQuestionIndex];
    if (!activeStep) {
      return false;
    }

    const stepName = activeStep.getAttribute('data-step');

    if (stepName === 'name') {
      const value = personNameInput ? personNameInput.value.trim() : '';
      if (!value) {
        setStatus('Introduce el nombre para continuar.', 'is-error');
        if (personNameInput) {
          personNameInput.focus();
        }
        return false;
      }
    }

    if (stepName === 'age') {
      const age = parseAgeValue();
      if (!Number.isFinite(age) || age < 0 || age > 120) {
        setStatus('Indica una edad válida entre 0 y 120.', 'is-error');
        if (personAgeInput) {
          personAgeInput.focus();
        }
        return false;
      }

      updateFlowByAttendance();
    }

    if (stepName === 'attendance' && !getCheckedValue(personForm, 'attendance')) {
      setStatus('Selecciona si asistirá para continuar.', 'is-error');
      return false;
    }

    if (stepName === 'bus' && !getCheckedValue(personForm, 'bus')) {
      setStatus('Selecciona si necesita autobús.', 'is-error');
      return false;
    }

    if (stepName === 'menu' && !getCheckedValue(personForm, 'menu')) {
      setStatus('Selecciona carne o pescado para continuar.', 'is-error');
      return false;
    }

    if (stepName === 'childMenu' && !getCheckedValue(personForm, 'childMenu')) {
      setStatus('Indica si quiere menú niño.', 'is-error');
      return false;
    }

    if (stepName === 'childMenu') {
      updateChildMenuVisibility();
    }

    return true;
  };

  const renderPersonStep = () => {
    if (!personForm || !personTitle || !prevButton || !nextButton) {
      return;
    }

    const personNumber = currentPersonIndex + 1;
    const isPrimary = currentPersonIndex === 0;
    const isLast = currentPersonIndex === totalPeople - 1;
    const existing = peopleData[currentPersonIndex] || {};

    personTitle.textContent = isPrimary
      ? `Persona invitada (${personNumber}/${totalPeople})`
      : `Acompañante ${personNumber - 1} (${personNumber}/${totalPeople})`;

    if (personNameInput) {
      personNameInput.value = existing.name || (isPrimary ? primaryName : '');
    }

    if (personAgeInput) {
      personAgeInput.value = Number.isFinite(existing.age) ? String(existing.age) : '';
    }

    clearChoice(personForm, 'attendance');
    clearChoice(personForm, 'bus');
    clearChoice(personForm, 'menu');
    clearChoice(personForm, 'childMenu');

    if (existing.attendance) {
      setCheckedValue(personForm, 'attendance', existing.attendance);
    }

    if (existing.bus) {
      setCheckedValue(personForm, 'bus', existing.bus);
    }

    if (existing.menu) {
      setCheckedValue(personForm, 'menu', existing.menu);
    }

    if (existing.childMenu && existing.childMenu !== 'no-aplica') {
      setCheckedValue(personForm, 'childMenu', existing.childMenu);
    }

    if (allergiesInput) {
      allergiesInput.value = existing.allergies || '';
    }

    if (messageInput) {
      messageInput.value = existing.message || '';
    }

    updateFlowByAttendance();
    currentQuestionIndex = 0;
    showCurrentQuestion();
  };

  const resetWizard = () => {
    primaryName = '';
    companions = 0;
    totalPeople = 0;
    currentPersonIndex = 0;
    currentQuestionIndex = 0;
    peopleData = [];

    if (setupForm) {
      setupForm.reset();
      setupForm.hidden = false;
    }

    if (personForm) {
      personForm.reset();
      personForm.hidden = true;
    }

    if (donePanel) {
      donePanel.hidden = true;
    }

    if (progress) {
      progress.textContent = 'Paso 1 de 2';
    }

    if (questionProgress) {
      questionProgress.textContent = '';
    }

    setStatus('', null);
  };

  const saveCurrentPerson = () => {
    if (!personForm || !personNameInput || !personAgeInput) {
      return false;
    }

    const name = personNameInput.value.trim();
    const age = parseAgeValue();
    const attendance = getCheckedValue(personForm, 'attendance');
    const bus = getCheckedValue(personForm, 'bus');
    const menu = getCheckedValue(personForm, 'menu');
    const childMenu = getCheckedValue(personForm, 'childMenu');
    const attends = attendance === 'si';
    const isChild = Number.isFinite(age) && age >= 0 && age < 10;
    const wantsChildMenu = childMenu === 'si';
    const needsStandardMenu = attends && (!isChild || childMenu === 'no');

    if (!name || !Number.isFinite(age) || !attendance) {
      setStatus('Hay respuestas pendientes. Revisa este registro antes de continuar.', 'is-error');
      return false;
    }

    if (attends && !bus) {
      setStatus('Selecciona si necesita autobús.', 'is-error');
      return false;
    }

    if (attends && isChild && !childMenu) {
      setStatus('Falta indicar si quiere menú niño.', 'is-error');
      return false;
    }

    if (attends && needsStandardMenu && !menu) {
      setStatus('Selecciona carne o pescado para continuar.', 'is-error');
      return false;
    }

    const busValue = attends ? bus : 'no-aplica';
    const menuValue = attends ? (wantsChildMenu ? 'infantil' : menu) : 'no-aplica';
    const childMenuValue = attends ? (isChild ? childMenu : 'no-aplica') : 'no-aplica';

    peopleData[currentPersonIndex] = {
      name,
      age,
      attendance,
      bus: busValue,
      menu: menuValue,
      childMenu: childMenuValue,
      isChild,
      allergies: allergiesInput ? allergiesInput.value.trim() : '',
      message: messageInput ? messageInput.value.trim() : '',
      isPrimary: currentPersonIndex === 0,
      companions,
      primaryName,
    };

    return true;
  };

  if (setupForm) {
    setupForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(setupForm);
      const invitedName = String(formData.get('primaryName') || '').trim();
      const companionsRaw = Number(formData.get('companions') || 0);
      const companionsSafe = Number.isFinite(companionsRaw) ? Math.max(0, Math.min(5, companionsRaw)) : 0;

      if (!invitedName) {
        setStatus('Indica el nombre de la persona invitada para comenzar.', 'is-error');
        return;
      }

      primaryName = invitedName;
      companions = companionsSafe;
      totalPeople = 1 + companions;
      currentPersonIndex = 0;
      peopleData = Array.from({ length: totalPeople }, () => ({}));

      setupForm.hidden = true;
      if (personForm) {
        personForm.hidden = false;
      }
      if (donePanel) {
        donePanel.hidden = true;
      }

      renderPersonStep();
      setStatus('', null);
    });
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex -= 1;
        showCurrentQuestion();
        setStatus('', null);
      }
    });
  }

  if (personAgeInput) {
    personAgeInput.addEventListener('input', () => {
      updateFlowByAttendance();
      showCurrentQuestion();
    });
  }

  if (personForm) {
    personForm.querySelectorAll('input[name="attendance"]').forEach((option) => {
      option.addEventListener('change', () => {
        updateFlowByAttendance();
        showCurrentQuestion();
      });
    });

    personForm.querySelectorAll('input[name="childMenu"]').forEach((option) => {
      option.addEventListener('change', () => {
        updateFlowByAttendance();
        showCurrentQuestion();
      });
    });
  }

  if (personForm) {
    personForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        if (!validateCurrentQuestion()) {
          return;
        }

        const visibleSteps = getVisibleSteps();
        const isLastQuestion = currentQuestionIndex === visibleSteps.length - 1;

        if (!isLastQuestion) {
          currentQuestionIndex += 1;
          showCurrentQuestion();
          setStatus('', null);
          return;
        }

        if (!saveCurrentPerson()) {
          return;
        }

        const isLast = currentPersonIndex === totalPeople - 1;
        if (isLast) {
          nextButton.disabled = true;
          showDoneResult('loading');
          await submitGroupToServer();
          showDoneResult('success');
          setStatus('', null);
          return;
        }

        currentPersonIndex += 1;
        renderPersonStep();
        setStatus('', null);
      } catch (error) {
        const fallbackMessage = 'Ha surgido un error. Por favor, ponte en contacto con los novios para confirmar tu asistencia.';
        const errorMessage = error && error.message ? error.message : fallbackMessage;
        showDoneResult('error');
        setStatus(errorMessage, 'is-error');
        if (resultMessage) {
          resultMessage.textContent = errorMessage;
        }
      } finally {
        if (nextButton) {
          nextButton.disabled = false;
        }
      }
    });
  }

  resetWizard();
}

initRsvpWizard();
